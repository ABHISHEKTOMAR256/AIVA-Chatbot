"""Lost & Found routes."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import UserInfo
from app.schemas.lost_found import LostFoundCreate, LostFoundResponse
from app.services.lost_found_service import LostFoundService

router = APIRouter(prefix="/lost-found", tags=["lost-found"])


class StatusUpdatePayload(BaseModel):
    status: str


@router.post("", response_model=LostFoundResponse, status_code=status.HTTP_201_CREATED)
async def create_lost_found_item(
    payload: LostFoundCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LostFoundResponse:
    """Report a lost or found item."""
    item = await LostFoundService.create_item(db, current_user.id, payload)
    await db.commit()
    await db.refresh(item)
    return LostFoundResponse.model_validate(item)


@router.get("", response_model=List[LostFoundResponse])
async def search_lost_found_items(
    query: Optional[str] = Query(None, description="Search term for title, description, or location"),
    item_type: Optional[str] = Query(None, description="lost or found"),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query("open"),
    db: AsyncSession = Depends(get_db),
) -> List[LostFoundResponse]:
    """Search public lost and found items. Anonymous reports hide user ownership."""
    items = await LostFoundService.search_items(
        db, query=query, item_type=item_type, category=category, status=status
    )
    result = []
    for item in items:
        resp = LostFoundResponse.model_validate(item)
        if item.is_anonymous:
            resp.user_id = None
        result.append(resp)
    return result


@router.get("/my", response_model=List[LostFoundResponse])
async def get_my_items(
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[LostFoundResponse]:
    """List all items reported by the current user."""
    items = await LostFoundService.get_user_items(db, current_user.id)
    return [LostFoundResponse.model_validate(i) for i in items]


@router.get("/{item_id}", response_model=LostFoundResponse)
async def get_item_details(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> LostFoundResponse:
    """Get public details for a single lost/found item."""
    item = await LostFoundService.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    resp = LostFoundResponse.model_validate(item)
    if item.is_anonymous:
        resp.user_id = None
    return resp


@router.patch("/{item_id}", response_model=LostFoundResponse)
async def update_item_status(
    item_id: UUID,
    payload: StatusUpdatePayload,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LostFoundResponse:
    """Update status of item (owner only)."""
    item = await LostFoundService.update_item_status(
        db, item_id=item_id, user_id=current_user.id, new_status=payload.status
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")
    await db.commit()
    await db.refresh(item)
    return LostFoundResponse.model_validate(item)
