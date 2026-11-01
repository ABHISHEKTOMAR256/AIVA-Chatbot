"""Analytics event model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import GUID


class AnalyticsEvent(Base):
    """Generic analytics / audit event row."""

    __tablename__ = "analytics_events"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID, primary_key=True, default=uuid.uuid4
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    conversation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
    )
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
