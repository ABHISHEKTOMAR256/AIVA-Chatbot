"""Message / chat schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    """Payload for adding a message."""

    content: str = Field(..., min_length=1, max_length=10000)
    message_type: str = "text"


class MessageResponse(BaseModel):
    """Single message representation."""

    id: UUID
    conversation_id: UUID
    sender_type: str
    content: str
    message_type: str
    attachment_id: Optional[UUID] = None
    ai_model: Optional[str] = None
    response_time_ms: Optional[int] = None
    processing_status: str = "processed"
    telegram_message_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    """User chat input."""

    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[UUID] = None


class ChatResponse(BaseModel):
    """AI chat response."""

    response: str
    conversation_id: UUID
    message_id: UUID
