"""Authentication and user session routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import generate_link_code, get_current_user
from app.models.profile import Profile
from app.schemas.auth import TelegramLinkResponse, UserInfo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: UserInfo = Depends(get_current_user)) -> UserInfo:
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/telegram-link", response_model=TelegramLinkResponse)
async def create_telegram_link(
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TelegramLinkResponse:
    """Generate a single-use 15-minute verification code to link a Telegram account."""
    code, expires_at = generate_link_code()

    profile = await db.get(Profile, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.telegram_link_code = code
    profile.telegram_link_expires = expires_at
    await db.commit()

    return TelegramLinkResponse(
        code=code,
        expires_at=expires_at,
        message=f"Send `/link {code}` to the AIVA Telegram bot within 15 minutes to link your account.",
    )


@router.delete("/logout")
async def logout(current_user: UserInfo = Depends(get_current_user)) -> dict:
    """Server-side cleanup on logout."""
    return {"message": "Logged out successfully"}
