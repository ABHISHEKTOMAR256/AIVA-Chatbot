"""Media / file upload service — Supabase Storage integration."""

from __future__ import annotations

import uuid as _uuid
from typing import Optional, Set
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.models.media_file import MediaFile

logger = get_logger("app")

ALLOWED_TYPES: Set[str] = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
}
MAX_SIZE: int = 10 * 1024 * 1024  # 10 MB
BUCKET_NAME: str = "aiva-media"


class MediaService:
    """Upload, retrieve, and delete files via Supabase Storage."""

    @staticmethod
    def validate_file(file: UploadFile) -> bool:
        """Check MIME type. Size is validated during read."""
        if file.content_type not in ALLOWED_TYPES:
            raise ValueError(
                f"Unsupported file type '{file.content_type}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_TYPES))}"
            )
        return True

    @staticmethod
    async def upload_file(
        db: AsyncSession,
        user_id: UUID,
        file: UploadFile,
        complaint_id: Optional[UUID] = None,
        lost_found_id: Optional[UUID] = None,
    ) -> MediaFile:
        """Validate, upload to Supabase Storage, and record metadata."""
        MediaService.validate_file(file)

        # Read file content
        content = await file.read()
        if len(content) > MAX_SIZE:
            raise ValueError(
                f"File too large ({len(content)} bytes). Maximum is {MAX_SIZE} bytes."
            )

        # Generate a safe filename
        ext = ""
        if file.filename and "." in file.filename:
            ext = "." + file.filename.rsplit(".", 1)[1].lower()
        stored_filename = f"{_uuid.uuid4().hex}{ext}"
        storage_path = f"uploads/{user_id}/{stored_filename}"

        # Upload to Supabase Storage
        try:
            from app.integrations.supabase_client import get_supabase

            sb = get_supabase()
            sb.storage.from_(BUCKET_NAME).upload(
                path=storage_path,
                file=content,
                file_options={"content-type": file.content_type or "application/octet-stream"},
            )
        except Exception as exc:
            logger.error("Supabase storage upload failed: %s", exc)
            raise ValueError("File upload failed. Please try again.") from exc

        media = MediaFile(
            user_id=user_id,
            filename=file.filename or stored_filename,
            stored_filename=stored_filename,
            mime_type=file.content_type or "application/octet-stream",
            file_size=len(content),
            storage_path=storage_path,
            bucket_name=BUCKET_NAME,
            complaint_id=complaint_id,
            lost_found_item_id=lost_found_id,
        )
        db.add(media)
        await db.flush()
        logger.info("File %s uploaded by user %s (%d bytes)", stored_filename, user_id, len(content))
        return media

    @staticmethod
    async def get_file_url(
        db: AsyncSession,
        file_id: UUID,
        user_id: UUID,
        is_admin: bool = False,
    ) -> str:
        """Generate a signed URL (1-hour expiry). Verify ownership unless admin."""
        stmt = select(MediaFile).where(MediaFile.id == file_id)
        result = await db.execute(stmt)
        media = result.scalar_one_or_none()

        if media is None:
            raise ValueError("File not found")
        if not is_admin and media.user_id != user_id:
            raise PermissionError("You do not have access to this file")

        try:
            from app.integrations.supabase_client import get_supabase

            sb = get_supabase()
            response = sb.storage.from_(media.bucket_name).create_signed_url(
                path=media.storage_path,
                expires_in=3600,
            )
            return response.get("signedURL", response.get("signedUrl", ""))
        except Exception as exc:
            logger.error("Failed to generate signed URL: %s", exc)
            raise ValueError("Could not generate file URL") from exc

    @staticmethod
    async def delete_file(
        db: AsyncSession,
        file_id: UUID,
        user_id: UUID,
        is_admin: bool = False,
    ) -> None:
        """Delete a file from storage and the database."""
        stmt = select(MediaFile).where(MediaFile.id == file_id)
        result = await db.execute(stmt)
        media = result.scalar_one_or_none()

        if media is None:
            raise ValueError("File not found")
        if not is_admin and media.user_id != user_id:
            raise PermissionError("You do not have access to this file")

        try:
            from app.integrations.supabase_client import get_supabase

            sb = get_supabase()
            sb.storage.from_(media.bucket_name).remove([media.storage_path])
        except Exception as exc:
            logger.warning("Failed to delete from storage (proceeding): %s", exc)

        await db.delete(media)
        await db.flush()
