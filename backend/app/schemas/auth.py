"""Authentication / user schemas."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class TokenPayload(BaseModel):
    """Decoded JWT claims."""

    sub: str
    exp: int
    role: Optional[str] = None


class UserInfo(BaseModel):
    """Authenticated user representation returned by security deps."""

    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str = "user"
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class TelegramLinkRequest(BaseModel):
    """Request body sent from Telegram bot to link accounts."""

    code: str = Field(..., min_length=4, max_length=32)


class TelegramLinkResponse(BaseModel):
    """Result of a Telegram linking attempt."""

    success: bool
    message: str
