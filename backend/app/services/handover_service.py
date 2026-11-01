"""Human-handover business logic."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.handover_request import HandoverRequest
from app.models.message import Message
from app.services.conversation_service import ConversationService

logger = get_logger("app")


class HandoverService:
    """Manages conversation escalation from AI to human staff."""

    @staticmethod
    async def request_handover(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        reason: str,
    ) -> HandoverRequest:
        """Create a handover request and switch the conversation mode."""
        # Check for existing pending handover
        existing = await db.execute(
            select(HandoverRequest).where(
                HandoverRequest.conversation_id == conversation_id,
                HandoverRequest.status == "pending",
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ValueError("A handover request is already pending for this conversation")

        hr = HandoverRequest(
            conversation_id=conversation_id,
            user_id=user_id,
            reason=reason,
            status="pending",
        )
        db.add(hr)

        await ConversationService.set_handling_mode(db, conversation_id, "pending_handover")

        # System message
        await ConversationService.add_message(
            db,
            conversation_id,
            sender_type="system",
            content="🔔 This conversation has been escalated to hostel staff. Someone will be with you shortly.",
            message_type="system",
        )

        # Analytics
        from app.services.analytics_service import AnalyticsService

        await AnalyticsService.log_event(
            db,
            event_type="handover_requested",
            user_id=user_id,
            conversation_id=conversation_id,
            metadata={"reason": reason},
        )

        await db.flush()
        logger.info("Handover requested for conversation %s", conversation_id)
        return hr

    @staticmethod
    async def get_pending_handovers(db: AsyncSession) -> List[HandoverRequest]:
        """List all pending handover requests (admin view)."""
        stmt = (
            select(HandoverRequest)
            .where(HandoverRequest.status == "pending")
            .order_by(HandoverRequest.created_at.asc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def claim_handover(
        db: AsyncSession,
        handover_id: UUID,
        staff_id: UUID,
    ) -> HandoverRequest:
        """Staff claims a pending handover."""
        stmt = select(HandoverRequest).where(HandoverRequest.id == handover_id)
        result = await db.execute(stmt)
        hr = result.scalar_one_or_none()
        if hr is None:
            raise ValueError("Handover request not found")
        if hr.status != "pending":
            raise ValueError("This handover has already been claimed or resolved")

        hr.status = "claimed"
        hr.claimed_by = staff_id
        hr.claimed_at = datetime.now(timezone.utc)
        await ConversationService.set_handling_mode(db, hr.conversation_id, "human")

        await ConversationService.add_message(
            db,
            hr.conversation_id,
            sender_type="system",
            content="✅ A staff member has joined the conversation.",
            message_type="system",
        )

        await db.flush()
        return hr

    @staticmethod
    async def resolve_handover(
        db: AsyncSession,
        handover_id: UUID,
        staff_id: UUID,
    ) -> HandoverRequest:
        """Resolve a handover and return the conversation to AI mode."""
        stmt = select(HandoverRequest).where(HandoverRequest.id == handover_id)
        result = await db.execute(stmt)
        hr = result.scalar_one_or_none()
        if hr is None:
            raise ValueError("Handover request not found")

        hr.status = "resolved"
        hr.resolved_at = datetime.now(timezone.utc)
        await ConversationService.set_handling_mode(db, hr.conversation_id, "ai")

        await ConversationService.add_message(
            db,
            hr.conversation_id,
            sender_type="system",
            content="ℹ️ The staff member has resolved this conversation. You're now back with AIVA.",
            message_type="system",
        )

        await db.flush()
        return hr

    @staticmethod
    async def send_staff_reply(
        db: AsyncSession,
        conversation_id: UUID,
        staff_id: UUID,
        message: str,
    ) -> Message:
        """Post a staff reply into the conversation."""
        return await ConversationService.add_message(
            db,
            conversation_id,
            sender_type="staff",
            content=message,
            message_type="text",
        )

    @staticmethod
    async def return_to_ai(
        db: AsyncSession,
        conversation_id: UUID,
        staff_id: UUID,
    ) -> None:
        """Return a conversation to AI handling without resolving the handover."""
        await ConversationService.set_handling_mode(db, conversation_id, "ai")
        await ConversationService.add_message(
            db,
            conversation_id,
            sender_type="system",
            content="ℹ️ You are now back with AIVA. Type /human if you need staff help again.",
            message_type="system",
        )
        await db.flush()
