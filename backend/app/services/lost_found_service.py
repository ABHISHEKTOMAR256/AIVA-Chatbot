"""Lost & Found business logic."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.lost_found_item import LostFoundItem
from app.schemas.lost_found import LostFoundCreate

logger = get_logger("app")


class LostFoundService:
    """CRUD for lost/found items."""

    @staticmethod
    async def create_item(
        db: AsyncSession,
        user_id: UUID,
        data: LostFoundCreate,
    ) -> LostFoundItem:
        """Register a new lost or found item."""
        item = LostFoundItem(
            user_id=user_id,
            item_type=data.item_type,
            title=data.title,
            description=data.description,
            location=data.location,
            date_occurred=data.date_occurred,
            category=data.category,
            status="open",
            contact_method=data.contact_method,
            is_anonymous=data.is_anonymous,
        )
        db.add(item)
        await db.flush()

        from app.services.analytics_service import AnalyticsService

        await AnalyticsService.log_event(
            db,
            event_type="lost_found_created",
            user_id=user_id,
            metadata={"item_type": data.item_type, "category": data.category},
        )

        logger.info("Lost/found item %s created by %s", item.id, user_id)
        return item

    @staticmethod
    async def search_items(
        db: AsyncSession,
        query: Optional[str] = None,
        item_type: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[LostFoundItem]:
        """Search / filter lost-found items."""
        stmt = select(LostFoundItem)

        if item_type:
            stmt = stmt.where(LostFoundItem.item_type == item_type)
        if category:
            stmt = stmt.where(LostFoundItem.category == category)
        if status:
            stmt = stmt.where(LostFoundItem.status == status)
        if query:
            pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    LostFoundItem.title.ilike(pattern),
                    LostFoundItem.description.ilike(pattern),
                    LostFoundItem.location.ilike(pattern),
                )
            )

        stmt = stmt.order_by(LostFoundItem.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_user_items(
        db: AsyncSession,
        user_id: UUID,
    ) -> List[LostFoundItem]:
        """List all items reported by a user."""
        stmt = (
            select(LostFoundItem)
            .where(LostFoundItem.user_id == user_id)
            .order_by(LostFoundItem.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update_item_status(
        db: AsyncSession,
        item_id: UUID,
        user_id: UUID,
        new_status: str,
    ) -> Optional[LostFoundItem]:
        """Update the status (owner-only)."""
        stmt = select(LostFoundItem).where(
            LostFoundItem.id == item_id,
            LostFoundItem.user_id == user_id,
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if item is None:
            return None
        item.status = new_status
        item.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return item

    @staticmethod
    async def get_item(
        db: AsyncSession,
        item_id: UUID,
    ) -> Optional[LostFoundItem]:
        """Fetch a single item by ID."""
        stmt = select(LostFoundItem).where(LostFoundItem.id == item_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
