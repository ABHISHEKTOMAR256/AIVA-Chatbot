"""Authentication, authorization, and security utilities."""

from __future__ import annotations

import secrets
import string
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import UUID

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.logging_config import get_logger
from app.schemas.auth import UserInfo

logger = get_logger("app")
security_scheme = HTTPBearer(auto_error=False)

# In-memory sliding window rate limiter for admin authentication
_login_attempts: Dict[str, List[float]] = {}


def check_login_rate_limit(ip_address: str, max_attempts: int = 5, window_seconds: int = 600) -> bool:
    """Sliding-window IP rate limiter to protect admin login endpoints."""
    now = time.time()
    attempts = _login_attempts.get(ip_address, [])
    valid_attempts = [t for t in attempts if now - t < window_seconds]
    _login_attempts[ip_address] = valid_attempts
    return len(valid_attempts) < max_attempts


def record_login_failure(ip_address: str) -> None:
    """Record a failed login attempt for rate limiting."""
    now = time.time()
    if ip_address not in _login_attempts:
        _login_attempts[ip_address] = []
    _login_attempts[ip_address].append(now)


def reset_login_attempts(ip_address: str) -> None:
    """Clear failed login attempts on successful login."""
    _login_attempts.pop(ip_address, None)


def hash_password(password: str) -> str:
    """Hash password with bcrypt using 12 salt rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify plain password against stored bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_admin_access_token(
    user_id: UUID,
    role: str,
    email: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Issue a signed JWT session token for authenticated administrators."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=12))
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": "aiva-admin",
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm="HS256")


async def _resolve_supabase_user(token: str) -> dict:
    """Verify a Supabase JWT and return the user payload."""
    from app.integrations.supabase_client import verify_supabase_token

    return await verify_supabase_token(token)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserInfo:
    """FastAPI dependency — authenticate via admin JWT (Bearer or Cookie) or Supabase JWT."""
    token: Optional[str] = None
    if credentials:
        token = credentials.credentials
    else:
        # Check HTTP-only cookie
        token = request.cookies.get("aiva_admin_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    settings = get_settings()
    user_id = None
    email = ""
    assigned_role: Optional[str] = None
    full_name: Optional[str] = None

    # 1. Try decoding as local signed Admin JWT
    try:
        payload = jwt.decode(token, settings.APP_SECRET_KEY, algorithms=["HS256"], issuer="aiva-admin")
        user_id = payload.get("sub")
        email = payload.get("email", "")
        assigned_role = payload.get("role")
    except Exception:
        # 2. Try validating as Firebase Google ID token
        try:
            from app.integrations.firebase_auth import verify_firebase_id_token
            import uuid

            fb_payload = await verify_firebase_id_token(token)
            fb_uid = fb_payload.get("sub") or fb_payload.get("user_id")
            email = (fb_payload.get("email") or "").lower()
            full_name = fb_payload.get("name") or fb_payload.get("displayName")
            # Generate deterministic UUID for database compatibility
            user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"firebase:{fb_uid}"))
            # Enforce server-side administrator allowlist
            if email in settings.admin_emails_set:
                assigned_role = "admin"
            else:
                assigned_role = "user"
        except Exception:
            # 3. Fall back to Supabase OAuth JWT
            try:
                user_payload = await _resolve_supabase_user(token)
                user_id = user_payload.get("sub") or user_payload.get("id")
                email = user_payload.get("email", "")
            except Exception:
                logger.warning("Token verification failed across local JWT, Firebase, and Supabase")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Fetch profile from database
    from app.models.profile import Profile

    stmt = select(Profile).where(Profile.id == UUID(str(user_id)))
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if profile is None:
        # Check if email is in admin allowlist
        role_to_set = assigned_role or ("admin" if email in settings.admin_emails_set else "user")
        profile = Profile(
            id=UUID(str(user_id)),
            email=email,
            full_name=full_name,
            role=role_to_set,
            is_active=True,
        )
        db.add(profile)
        await db.flush()
    else:
        # If user is in admin allowlist, ensure their database role reflects it
        if email in settings.admin_emails_set and profile.role != "admin":
            profile.role = "admin"
            await db.flush()

    if not profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return UserInfo(
        id=profile.id,
        email=profile.email,
        full_name=profile.full_name or profile.email.split("@")[0],
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
