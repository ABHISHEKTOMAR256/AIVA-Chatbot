"""Complaint model."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class Complaint(BaseModel):
    """Hostel maintenance / service complaint."""

    __tablename__ = "complaints"

    reference_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    conversation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
    )
    category: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # electricity | water_supply | wifi | room_maintenance | cleaning | plumbing | other
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    room_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="submitted"
    )  # submitted | acknowledged | in_progress | resolved | closed
    priority: Mapped[str] = mapped_column(
        String(10), nullable=False, default="medium"
    )  # low | medium | high | urgent
    assigned_staff_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    staff_reply: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────
    user = relationship("Profile", back_populates="complaints", foreign_keys=[user_id])
    assigned_staff = relationship("Profile", foreign_keys=[assigned_staff_id])
    conversation = relationship("Conversation")
    media_files = relationship(
        "MediaFile", back_populates="complaint", foreign_keys="MediaFile.complaint_id"
    )
