"""Conversation model."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class Conversation(BaseModel):
    """A single conversation thread between a user and the system."""

    __tablename__ = "conversations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform: Mapped[str] = mapped_column(
        String(20), nullable=False, default="web"
    )  # web | telegram
    platform_conversation_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )  # active | closed | archived
    handling_mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ai"
    )  # ai | human | pending_handover
    assigned_staff_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    message_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Relationships ─────────────────────────────────────────
    user = relationship(
        "Profile",
        back_populates="conversations",
        foreign_keys=[user_id],
    )
    assigned_staff = relationship("Profile", foreign_keys=[assigned_staff_id])
    messages = relationship(
        "Message", back_populates="conversation", order_by="Message.created_at"
    )
    handover_request = relationship(
        "HandoverRequest", back_populates="conversation", uselist=False
    )
    feedback_entries = relationship("Feedback", back_populates="conversation")
