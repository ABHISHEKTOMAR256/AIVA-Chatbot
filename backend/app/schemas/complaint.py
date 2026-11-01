"""Complaint schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


VALID_CATEGORIES = {
    "electricity", "water_supply", "wifi",
    "room_maintenance", "cleaning", "plumbing", "other",
}
VALID_STATUSES = {"submitted", "acknowledged", "in_progress", "resolved", "closed"}
VALID_PRIORITIES = {"low", "medium", "high", "urgent"}


class ComplaintCreate(BaseModel):
    """Payload to register a new complaint."""

    category: str = Field(..., description="One of: electricity, water_supply, wifi, room_maintenance, cleaning, plumbing, other")
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=5000)
    location: Optional[str] = None
    room_number: Optional[str] = None
    priority: str = "medium"


class ComplaintUpdate(BaseModel):
    """Admin / staff update payload."""

    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_staff_id: Optional[UUID] = None
    internal_notes: Optional[str] = None
    staff_reply: Optional[str] = None


class ComplaintResponse(BaseModel):
    """Full complaint representation."""

    id: UUID
    reference_number: str
    user_id: UUID
    conversation_id: Optional[UUID] = None
    category: str
    title: str
    description: str
    location: Optional[str] = None
    room_number: Optional[str] = None
    status: str
    priority: str
    assigned_staff_id: Optional[UUID] = None
    internal_notes: Optional[str] = None
    staff_reply: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    """Paginated complaint list with status counts."""

    complaints: List[ComplaintResponse]
    total: int
    page: int = 1
    page_size: int = 20
    counts_by_status: Dict[str, int] = {}
