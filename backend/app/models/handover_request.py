"""Handover request model."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class HandoverRequest(BaseModel):
    """Tracks a request to escalate a conversation from AI to human staff."""

    __tablename__ = "handover_requests"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | claimed | resolved
    claimed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    claimed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────
    conversation = relationship("Conversation", back_populates="handover_request")
    user = relationship("Profile", foreign_keys=[user_id])
    claimed_by_staff = relationship("Profile", foreign_keys=[claimed_by])
