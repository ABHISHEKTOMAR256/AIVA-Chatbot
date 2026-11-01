"""Lost & Found item model."""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class LostFoundItem(BaseModel):
    """Record of a lost or found item reported by a student."""

    __tablename__ = "lost_found_items"

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_type: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # lost | found
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    date_occurred: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # electronics | clothing | documents | accessories | other
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="open"
    )  # open | matched | claimed | closed
    contact_method: Mapped[str] = mapped_column(
        String(10), nullable=False, default="chat"
    )  # chat | email
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ─────────────────────────────────────────
    user = relationship("Profile", back_populates="lost_found_items")
    media_files = relationship(
        "MediaFile",
        back_populates="lost_found_item",
        foreign_keys="MediaFile.lost_found_item_id",
    )
