"""Lost & Found schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LostFoundCreate(BaseModel):
    """Payload to report a lost or found item."""

    item_type: str = Field(..., description="lost or found")
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=5000)
    location: str = Field(..., max_length=255)
    date_occurred: date
    category: str = Field(
        ..., description="electronics, clothing, documents, accessories, or other"
    )
    contact_method: str = "chat"
    is_anonymous: bool = False


class LostFoundResponse(BaseModel):
    """Full lost/found item representation."""

    id: UUID
    user_id: Optional[UUID] = None  # hidden when anonymous
    item_type: str
    title: str
    description: str
    location: str
    date_occurred: date
    category: str
    status: str
    contact_method: str
    is_anonymous: bool
    images: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LostFoundSearch(BaseModel):
    """Search / filter parameters."""

    query: Optional[str] = None
    item_type: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
