"""Admin-specific schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AdminUserResponse(BaseModel):
    """User record for admin listing."""

    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserList(BaseModel):
    """Paginated user list for admin."""

    users: List[AdminUserResponse]
    total: int
    page: int = 1
    page_size: int = 20


class AdminComplaintFilter(BaseModel):
    """Query filters for admin complaint listing."""

    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class StaffAssignment(BaseModel):
    """Assign a staff member to a complaint."""

    complaint_id: UUID
    staff_id: UUID


class KnowledgeDocCreate(BaseModel):
    """Payload to add a knowledge-base document."""

    title: str = Field(..., min_length=3, max_length=512)
    content: str = Field(..., min_length=10)
    category: str = Field(..., description="rules, faq, procedures, or facilities")


class KnowledgeDocResponse(BaseModel):
    """Knowledge document representation."""

    id: UUID
    title: str
    content: str
    category: str
    chunk_index: int
    is_active: bool
    uploaded_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
