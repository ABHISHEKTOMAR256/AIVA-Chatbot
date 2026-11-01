"""Complaint management routes for students and staff."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import UserInfo
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintListResponse,
    ComplaintResponse,
)
from app.services.complaint_service import ComplaintService

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Create a new hostel complaint with auto-generated reference number."""
    try:
        complaint = await ComplaintService.create_complaint(
            db, user_id=current_user.id, data=payload
        )
        await db.commit()
        await db.refresh(complaint)
        return ComplaintResponse.model_validate(complaint)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[ComplaintResponse])
async def list_my_complaints(
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ComplaintResponse]:
    """List all complaints filed by the current user."""
    complaints = await ComplaintService.get_user_complaints(
        db, user_id=current_user.id, status_filter=status
    )
    return [ComplaintResponse.model_validate(c) for c in complaints]


@router.get("/{reference}", response_model=ComplaintResponse)
async def get_complaint(
    reference: str,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Look up a complaint by reference number (verifies user ownership)."""
    complaint = await ComplaintService.get_complaint_by_ref(
        db, user_id=current_user.id, reference_number=reference.upper()
    )
    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found or you are not authorized to view it.",
        )
    return ComplaintResponse.model_validate(complaint)
