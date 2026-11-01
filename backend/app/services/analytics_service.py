"""Analytics service — real SQL-backed metrics."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import distinct, func, select, text, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.analytics_event import AnalyticsEvent
from app.models.complaint import Complaint
from app.models.conversation import Conversation
from app.models.feedback import Feedback
from app.models.handover_request import HandoverRequest
from app.models.message import Message
from app.models.profile import Profile
from app.schemas.analytics import (
    ConversationProgress,
    DailyStats,
    DashboardStats,
)

logger = get_logger("app")


class AnalyticsService:
    """Collects and exports application metrics."""

    # ── Event logging ─────────────────────────────────────────

    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_type: str,
        user_id: Optional[UUID] = None,
        conversation_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AnalyticsEvent:
        """Write an analytics event row."""
        event = AnalyticsEvent(
            event_type=event_type,
            user_id=user_id,
            conversation_id=conversation_id,
            metadata_json=metadata,
        )
        db.add(event)
        await db.flush()
        return event

    # ── Dashboard stats ───────────────────────────────────────

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
        """Aggregate counters for the admin dashboard."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())

        total_users = (await db.execute(select(func.count(Profile.id)))).scalar() or 0
        total_conversations = (await db.execute(select(func.count(Conversation.id)))).scalar() or 0
        total_messages = (await db.execute(select(func.count(Message.id)))).scalar() or 0
        total_complaints = (await db.execute(select(func.count(Complaint.id)))).scalar() or 0

        open_complaints = (
            await db.execute(
                select(func.count(Complaint.id)).where(
                    Complaint.status.in_(["submitted", "acknowledged", "in_progress"])
                )
            )
        ).scalar() or 0

        resolved_complaints = (
            await db.execute(
                select(func.count(Complaint.id)).where(
                    Complaint.status.in_(["resolved", "closed"])
                )
            )
        ).scalar() or 0

        pending_handovers = (
            await db.execute(
                select(func.count(HandoverRequest.id)).where(
                    HandoverRequest.status == "pending"
                )
            )
        ).scalar() or 0

        avg_rt = (
            await db.execute(
                select(func.avg(Message.response_time_ms)).where(
                    Message.response_time_ms.isnot(None)
                )
            )
        ).scalar()

        conversations_today = (
            await db.execute(
                select(func.count(Conversation.id)).where(
                    Conversation.created_at >= today_start
                )
            )
        ).scalar() or 0

        conversations_this_week = (
            await db.execute(
                select(func.count(Conversation.id)).where(
                    Conversation.created_at >= week_start
                )
            )
        ).scalar() or 0

        return DashboardStats(
            total_users=total_users,
            total_conversations=total_conversations,
            total_messages=total_messages,
            total_complaints=total_complaints,
            open_complaints=open_complaints,
            resolved_complaints=resolved_complaints,
            pending_handovers=pending_handovers,
            avg_response_time_ms=round(avg_rt, 1) if avg_rt else None,
            conversations_today=conversations_today,
            conversations_this_week=conversations_this_week,
        )

    # ── Conversation progress ─────────────────────────────────

    @staticmethod
    async def get_conversation_progress(db: AsyncSession) -> ConversationProgress:
        """Count distinct conversations with >=2 user messages (genuine)."""
        subq = (
            select(Message.conversation_id)
            .where(Message.sender_type == "user")
            .group_by(Message.conversation_id)
            .having(func.count(Message.id) >= 2)
            .subquery()
        )
        total_genuine = (
            await db.execute(select(func.count()).select_from(subq))
        ).scalar() or 0

        target = 25
        return ConversationProgress(
            total_genuine=total_genuine,
            target=target,
            percentage=round(min(total_genuine / target * 100, 100), 1),
            remaining=max(target - total_genuine, 0),
        )

    # ── Daily stats ───────────────────────────────────────────

    @staticmethod
    async def get_daily_stats(
        db: AsyncSession, days: int = 30
    ) -> List[DailyStats]:
        """Per-day metrics for the last *days* days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        conv_rows = (
            await db.execute(
                select(
                    cast(Conversation.created_at, Date).label("d"),
                    func.count(Conversation.id),
                )
                .where(Conversation.created_at >= since)
                .group_by("d")
            )
        ).fetchall()
        conv_map: Dict[date, int] = {r[0]: r[1] for r in conv_rows}

        msg_rows = (
            await db.execute(
                select(
                    cast(Message.created_at, Date).label("d"),
                    func.count(Message.id),
                )
                .where(Message.created_at >= since)
                .group_by("d")
            )
        ).fetchall()
        msg_map: Dict[date, int] = {r[0]: r[1] for r in msg_rows}

        comp_rows = (
            await db.execute(
                select(
                    cast(Complaint.created_at, Date).label("d"),
                    func.count(Complaint.id),
                )
                .where(Complaint.created_at >= since)
                .group_by("d")
            )
        ).fetchall()
        comp_map: Dict[date, int] = {r[0]: r[1] for r in comp_rows}

        all_dates = sorted(
            set(list(conv_map.keys()) + list(msg_map.keys()) + list(comp_map.keys()))
        )

        return [
            DailyStats(
                date=d,
                conversations=conv_map.get(d, 0),
                messages=msg_map.get(d, 0),
                complaints=comp_map.get(d, 0),
            )
            for d in all_dates
        ]

    # ── Common categories ─────────────────────────────────────

    @staticmethod
    async def get_common_categories(db: AsyncSession) -> List[Dict[str, Any]]:
        """Most frequent complaint categories."""
        rows = (
            await db.execute(
                select(Complaint.category, func.count(Complaint.id).label("cnt"))
                .group_by(Complaint.category)
                .order_by(func.count(Complaint.id).desc())
            )
        ).fetchall()
        return [{"category": r[0], "count": r[1]} for r in rows]

    # ── Platform stats ────────────────────────────────────────

    @staticmethod
    async def get_platform_stats(db: AsyncSession) -> Dict[str, int]:
        """Web vs Telegram conversation counts."""
        rows = (
            await db.execute(
                select(Conversation.platform, func.count(Conversation.id))
                .group_by(Conversation.platform)
            )
        ).fetchall()
        return {r[0]: r[1] for r in rows}

    # ── CSV export ────────────────────────────────────────────

    @staticmethod
    async def export_analytics_csv(
        db: AsyncSession,
        include_messages: bool = False,
    ) -> bytes:
        """Export analytics data as CSV bytes."""
        buf = io.StringIO()
        writer = csv.writer(buf)

        # Summary
        stats = await AnalyticsService.get_dashboard_stats(db)
        writer.writerow(["--- Summary Metrics ---"])
        writer.writerow(["metric", "value"])
        writer.writerow(["total_users", stats.total_users])
        writer.writerow(["total_conversations", stats.total_conversations])
        writer.writerow(["total_complaints", stats.total_complaints])
        writer.writerow(["open_complaints", stats.open_complaints])
        writer.writerow(["resolved_complaints", stats.resolved_complaints])
        writer.writerow(["pending_handovers", stats.pending_handovers])
        writer.writerow([])

        # Conversations
        writer.writerow(["--- Conversations ---"])
        writer.writerow(["id", "user_id", "platform", "status", "handling_mode", "message_count", "created_at"])
        result = await db.execute(select(Conversation).order_by(Conversation.created_at.desc()))
        for c in result.scalars().all():
            writer.writerow([str(c.id), str(c.user_id), c.platform, c.status, c.handling_mode, c.message_count, c.created_at.isoformat()])

        writer.writerow([])

        # Complaints
        writer.writerow(["--- Complaints ---"])
        writer.writerow(["reference_number", "category", "status", "priority", "created_at", "resolved_at"])
        result = await db.execute(select(Complaint).order_by(Complaint.created_at.desc()))
        for comp in result.scalars().all():
            writer.writerow([
                comp.reference_number, comp.category, comp.status, comp.priority,
                comp.created_at.isoformat(),
                comp.resolved_at.isoformat() if comp.resolved_at else "",
            ])

        if include_messages:
            writer.writerow([])
            writer.writerow(["--- Messages ---"])
            writer.writerow(["id", "conversation_id", "sender_type", "message_type", "response_time_ms", "created_at"])
            result = await db.execute(select(Message).order_by(Message.created_at.desc()).limit(5000))
            for m in result.scalars().all():
                writer.writerow([
                    str(m.id), str(m.conversation_id), m.sender_type,
                    m.message_type, m.response_time_ms or "",
                    m.created_at.isoformat(),
                ])

        return buf.getvalue().encode("utf-8")
