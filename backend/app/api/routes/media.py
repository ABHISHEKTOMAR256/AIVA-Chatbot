"""File and media upload/access routes."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import UserInfo
from app.services.media_service import MediaService

router = APIRouter(prefix="/media", tags=["media"])


class MediaUploadResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    mime_type: str


class SignedUrlResponse(BaseModel):
    url: str


@router.post("/upload", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_media_file(
    file: UploadFile = File(...),
    complaint_id: Optional[UUID] = Form(None),
    lost_found_id: Optional[UUID] = Form(None),
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MediaUploadResponse:
    """Upload an image or document (max 10MB) to private Supabase storage."""
    try:
        media = await MediaService.upload_file(
            db=db,
            user_id=current_user.id,
            file=file,
            complaint_id=complaint_id,
            lost_found_id=lost_found_id,
        )
        await db.commit()
        await db.refresh(media)
        return MediaUploadResponse(
            id=media.id,
            filename=media.filename,
            file_size=media.file_size,
            mime_type=media.mime_type,
        )
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{file_id}/url", response_model=SignedUrlResponse)
async def get_signed_file_url(
    file_id: UUID,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SignedUrlResponse:
    """Get time-limited (1-hour) signed URL for private file access."""
    try:
        is_admin = current_user.role in ("admin", "staff")
        signed_url = await MediaService.get_file_url(
            db, file_id=file_id, user_id=current_user.id, is_admin=is_admin
        )
        return SignedUrlResponse(url=signed_url)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
