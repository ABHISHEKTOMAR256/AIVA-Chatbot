"""Authentication, authorization, and security utilities."""

from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.logging_config import get_logger
from app.schemas.auth import UserInfo

logger = get_logger("app")
security_scheme = HTTPBearer(auto_error=False)


async def _resolve_supabase_user(token: str) -> dict:
    """Verify a Supabase JWT and return the user payload.

    Uses the Supabase GoTrue REST endpoint so we always validate
    against the live session (respects logout / revocation).
    """
    from app.integrations.supabase_client import verify_supabase_token

    return await verify_supabase_token(token)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserInfo:
    """FastAPI dependency — authenticate via Supabase JWT and return UserInfo."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        user_payload = await _resolve_supabase_user(token)
    except Exception:
        logger.warning("Token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = user_payload.get("sub") or user_payload.get("id")
    email = user_payload.get("email", "")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Fetch or create the profile
    from app.models.profile import Profile

    stmt = select(Profile).where(Profile.id == UUID(str(user_id)))
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if profile is None:
        # First login — create a profile row
        profile = Profile(
            id=UUID(str(user_id)),
            email=email,
            full_name=user_payload.get("user_metadata", {}).get("full_name"),
            role="user",
            is_active=True,
        )
        db.add(profile)
        await db.flush()

    if not profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return UserInfo(
        id=profile.id,
        email=profile.email,
        full_name=profile.full_name,
        role=profile.role,
        avatar_url=profile.avatar_url,
    )


async def get_current_admin(
    current_user: UserInfo = Depends(get_current_user),
) -> UserInfo:
    """FastAPI dependency — require the ``admin`` or ``staff`` role."""
    if current_user.role not in ("admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or staff privileges required",
        )
    return current_user


def verify_telegram_webhook_secret(
    x_telegram_bot_api_secret_token: Optional[str] = Header(None),
) -> None:
    """Validate the Telegram webhook secret header."""
    settings = get_settings()
    expected = settings.TELEGRAM_WEBHOOK_SECRET
    if not expected:
        # If not configured, skip verification in dev
        return
    if x_telegram_bot_api_secret_token != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid webhook secret",
        )


def generate_link_code(length: int = 8) -> tuple[str, datetime]:
    """Generate a short-lived alphanumeric code for Telegram account linking.

    Returns the code and its expiry timestamp (15 minutes from now).
    """
    alphabet = string.ascii_uppercase + string.digits
    code = "".join(secrets.choice(alphabet) for _ in range(length))
    expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
    return code, expiry
