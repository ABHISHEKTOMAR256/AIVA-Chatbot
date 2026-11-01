"""Handover schemas."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.conversation import ConversationResponse


class HandoverCreate(BaseModel):
    """Request to escalate a conversation to human staff."""

    conversation_id: UUID
    reason: str = Field(..., min_length=5, max_length=2000)


class HandoverResponse(BaseModel):
    """Full handover representation."""

    id: UUID
    conversation_id: UUID
    user_id: UUID
    reason: str
    status: str
    claimed_by: Optional[UUID] = None
    claimed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    conversation: Optional[ConversationResponse] = None

    model_config = {"from_attributes": True}


class HandoverReply(BaseModel):
    """Staff reply message in a handover conversation."""

    message: str = Field(..., min_length=1, max_length=5000)
