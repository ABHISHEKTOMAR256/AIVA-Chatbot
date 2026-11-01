"""Feedback schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    """Payload to submit feedback on a conversation."""

    conversation_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Feedback representation."""

    id: UUID
    conversation_id: UUID
    user_id: UUID
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
