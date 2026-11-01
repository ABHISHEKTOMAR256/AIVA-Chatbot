"""Conversation schemas."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    """Payload to start a new conversation."""

    title: Optional[str] = None


class ConversationResponse(BaseModel):
    """Full conversation representation."""

    id: UUID
    user_id: UUID
    platform: str
    platform_conversation_id: Optional[str] = None
    title: Optional[str] = None
    status: str
    handling_mode: str
    assigned_staff_id: Optional[UUID] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    """Paginated list of conversations."""

    conversations: List[ConversationResponse]
    total: int
    page: int = 1
    page_size: int = 20
