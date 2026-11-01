"""User profile model."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class Profile(BaseModel):
    """Maps to the ``profiles`` table.

    The ``id`` deliberately mirrors ``auth.users.id`` in Supabase so
    foreign-key relationships stay in sync without a join table.
    """

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    telegram_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, nullable=True, unique=True
    )
    telegram_username: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    telegram_link_code: Mapped[Optional[str]] = mapped_column(
        String(32), nullable=True
    )
    telegram_link_expires: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ─────────────────────────────────────────
    conversations = relationship(
        "Conversation",
        back_populates="user",
        foreign_keys="Conversation.user_id",
        lazy="selectin",
    )
    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id")
    media_files = relationship("MediaFile", back_populates="user")
    feedback_entries = relationship("Feedback", back_populates="user")
    lost_found_items = relationship("LostFoundItem", back_populates="user")
