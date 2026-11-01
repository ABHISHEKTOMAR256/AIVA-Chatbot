"""Complaint business logic."""

from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.complaint import Complaint
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    VALID_CATEGORIES,
    VALID_PRIORITIES,
    VALID_STATUSES,
)

logger = get_logger("app")


class ComplaintService:
    """CRUD + domain logic for hostel complaints."""

    # ── Reference number generation ───────────────────────────

    @staticmethod
    async def _generate_reference(db: AsyncSession) -> str:
        """Generate a unique ``AIVA-YYYYMMDD-XXXX`` reference number."""
        date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
        for _ in range(20):  # retry to avoid collision
            rand_part = f"{random.randint(0, 9999):04d}"
            ref = f"AIVA-{date_part}-{rand_part}"
            existing = await db.execute(
                select(Complaint).where(Complaint.reference_number == ref)
            )
            if existing.scalar_one_or_none() is None:
                return ref
        raise RuntimeError("Could not generate a unique complaint reference number")

    # ── Create ────────────────────────────────────────────────

    @staticmethod
    async def create_complaint(
        db: AsyncSession,
        user_id: UUID,
        data: ComplaintCreate,
        conversation_id: Optional[UUID] = None,
    ) -> Complaint:
        """Register a new complaint and log an analytics event."""
        if data.category not in VALID_CATEGORIES:
            raise ValueError(f"Invalid category '{data.category}'. Must be one of: {', '.join(VALID_CATEGORIES)}")
        if data.priority not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority '{data.priority}'. Must be one of: {', '.join(VALID_PRIORITIES)}")

        ref = await ComplaintService._generate_reference(db)

        complaint = Complaint(
            reference_number=ref,
            user_id=user_id,
            conversation_id=conversation_id,
            category=data.category,
            title=data.title,
            description=data.description,
            location=data.location,
            room_number=data.room_number,
            status="submitted",
            priority=data.priority,
        )
        db.add(complaint)
        await db.flush()

        # Analytics event
        from app.services.analytics_service import AnalyticsService

        await AnalyticsService.log_event(
            db,
            event_type="complaint_created",
            user_id=user_id,
            metadata={"reference_number": ref, "category": data.category},
        )

        logger.info("Complaint %s created by user %s", ref, user_id)
        return complaint

    # ── Read (user) ───────────────────────────────────────────

    @staticmethod
    async def get_user_complaints(
        db: AsyncSession,
        user_id: UUID,
        status_filter: Optional[str] = None,
    ) -> List[Complaint]:
        """Return all complaints belonging to *user_id*, optionally filtered."""
        stmt = select(Complaint).where(Complaint.user_id == user_id)
        if status_filter:
            stmt = stmt.where(Complaint.status == status_filter)
        stmt = stmt.order_by(Complaint.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_complaint_by_ref(
        db: AsyncSession,
        user_id: UUID,
        reference_number: str,
    ) -> Optional[Complaint]:
        """Look up a complaint by reference number, verify ownership."""
        stmt = select(Complaint).where(
            Complaint.reference_number == reference_number,
            Complaint.user_id == user_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    # ── Update (staff / admin) ────────────────────────────────

    @staticmethod
    async def update_complaint(
        db: AsyncSession,
        complaint_id: UUID,
        data: ComplaintUpdate,
        staff_id: Optional[UUID] = None,
    ) -> Complaint:
        """Apply admin/staff updates to a complaint."""
        stmt = select(Complaint).where(Complaint.id == complaint_id)
        result = await db.execute(stmt)
        complaint = result.scalar_one_or_none()
        if complaint is None:
            raise ValueError("Complaint not found")

        if data.status is not None:
            if data.status not in VALID_STATUSES:
                raise ValueError(f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")
            complaint.status = data.status
            if data.status == "resolved":
                complaint.resolved_at = datetime.now(timezone.utc)
        if data.priority is not None:
            if data.priority not in VALID_PRIORITIES:
                raise ValueError(f"Invalid priority. Must be one of: {', '.join(VALID_PRIORITIES)}")
            complaint.priority = data.priority
        if data.assigned_staff_id is not None:
            complaint.assigned_staff_id = data.assigned_staff_id
        if data.internal_notes is not None:
            complaint.internal_notes = data.internal_notes
        if data.staff_reply is not None:
            complaint.staff_reply = data.staff_reply

        complaint.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return complaint

    # ── Stats ─────────────────────────────────────────────────

    @staticmethod
    async def get_complaint_stats(
        db: AsyncSession,
        user_id: Optional[UUID] = None,
    ) -> Dict[str, int]:
        """Count complaints grouped by status."""
        stmt = select(Complaint.status, func.count(Complaint.id))
        if user_id:
            stmt = stmt.where(Complaint.user_id == user_id)
        stmt = stmt.group_by(Complaint.status)
        result = await db.execute(stmt)
        return {row[0]: row[1] for row in result.fetchall()}

    # ── Admin: all complaints ─────────────────────────────────

    @staticmethod
    async def get_all_complaints(
        db: AsyncSession,
        category: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Complaint], int]:
        """Return paginated complaints with optional filters (admin)."""
        stmt = select(Complaint)
        count_stmt = select(func.count(Complaint.id))

        if category:
            stmt = stmt.where(Complaint.category == category)
            count_stmt = count_stmt.where(Complaint.category == category)
        if status:
            stmt = stmt.where(Complaint.status == status)
            count_stmt = count_stmt.where(Complaint.status == status)
        if priority:
            stmt = stmt.where(Complaint.priority == priority)
            count_stmt = count_stmt.where(Complaint.priority == priority)

        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        stmt = stmt.order_by(Complaint.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)

        return list(result.scalars().all()), total
