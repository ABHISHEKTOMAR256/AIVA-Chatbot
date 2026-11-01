"""Message model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import GUID


class Message(Base):
    """Individual message within a conversation."""

    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID, primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # user | ai | system | staff
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="text"
    )  # text | image | file | system
    attachment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("media_files.id", ondelete="SET NULL"),
        nullable=True,
    )
    ai_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    response_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    processing_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="processed"
    )  # pending | processed | failed
    telegram_message_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────
    conversation = relationship("Conversation", back_populates="messages")
    attachment = relationship("MediaFile", lazy="joined")
