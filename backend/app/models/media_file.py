"""Media / file attachment model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import GUID


class MediaFile(Base):
    """Tracks an uploaded file stored in Supabase Storage."""

    __tablename__ = "media_files"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    bucket_name: Mapped[str] = mapped_column(String(100), nullable=False, default="aiva-media")
    complaint_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("complaints.id", ondelete="SET NULL"),
        nullable=True,
    )
    lost_found_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("lost_found_items.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────
    user = relationship("Profile", back_populates="media_files")
    complaint = relationship("Complaint", back_populates="media_files", foreign_keys=[complaint_id])
    lost_found_item = relationship("LostFoundItem", back_populates="media_files", foreign_keys=[lost_found_item_id])
