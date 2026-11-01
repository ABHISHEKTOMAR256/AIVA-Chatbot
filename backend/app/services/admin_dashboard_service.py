"""Admin Dashboard Service — Real database aggregation for 3D Control Center."""

from __future__ import annotations

import csv
import io
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

import httpx
from sqlalchemy import desc, distinct, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.models.analytics_event import AnalyticsEvent
from app.models.audit_log import AdminAuditLog
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.profile import Profile
from app.schemas.admin import (
    AdminConversationDetail,
    AdminConversationItem,
    BotHealthResponse,
    TelegramDashboardStats,
    TelegramUserItem,
)

logger = get_logger("admin")


class AdminDashboardService:
    """Provides high-performance, real-time database queries for the 3D admin dashboard."""

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> TelegramDashboardStats:
        """Calculate real-time KPIs strictly from PostgreSQL records."""
        settings = get_settings()

        # 1. Total telegram users (profiles with telegram_id)
        tg_users = await db.scalar(
            select(func.count(distinct(Profile.id))).where(Profile.telegram_id.isnot(None))
        ) or 0

        # Total conversations
        total_convs = await db.scalar(select(func.count(Conversation.id))) or 0

        # Total messages received from users
        total_received = await db.scalar(
            select(func.count(Message.id)).where(Message.sender_type == "user")
        ) or 0

        # Total bot replies generated
        total_replies = await db.scalar(
            select(func.count(Message.id)).where(Message.sender_type.in_(["ai", "system"]))
        ) or 0

        # Active users today (UTC midnight to now)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        active_today = await db.scalar(
            select(func.count(distinct(Conversation.user_id))).where(
                Conversation.updated_at >= today_start
            )
        ) or 0

        # Active users in the last 7 days
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        active_7d = await db.scalar(
            select(func.count(distinct(Conversation.user_id))).where(
                Conversation.updated_at >= seven_days_ago
            )
        ) or 0

        # Average response time (ms)
        avg_latency = await db.scalar(
            select(func.avg(Message.response_time_ms)).where(Message.response_time_ms.isnot(None))
        ) or 0.0

        # Failed messages
        failed_count = await db.scalar(
            select(func.count(Message.id)).where(Message.processing_status == "failed")
        ) or 0

        return TelegramDashboardStats(
            total_telegram_users=int(tg_users),
            total_conversations=int(total_convs),
            total_messages_received=int(total_received),
            total_bot_replies=int(total_replies),
            active_users_today=int(active_today),
            active_users_7d=int(active_7d),
            avg_response_time_ms=round(float(avg_latency), 1),
            failed_messages=int(failed_count),
            bot_online=True,
            bot_username="AIVA_LPU_bot",
        )

    @staticmethod
    async def get_analytics_charts(db: AsyncSession, days: int = 14) -> Dict[str, Any]:
        """Aggregate daily metrics for charts over the last N days."""
        now = datetime.now(timezone.utc)
        start_date = (now - timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Fetch conversations created per day
        conv_stmt = (
            select(
                func.date_trunc("day", Conversation.created_at).label("day"),
                func.count(Conversation.id).label("count"),
            )
            .where(Conversation.created_at >= start_date)
            .group_by("day")
            .order_by("day")
        )
        conv_res = (await db.execute(conv_stmt)).all()
        conv_by_day = {row.day.strftime("%Y-%m-%d"): row.count for row in conv_res if row.day}

        # 2. Fetch messages received vs replies per day
        msg_stmt = (
            select(
                func.date_trunc("day", Message.created_at).label("day"),
                Message.sender_type,
                func.count(Message.id).label("count"),
            )
            .where(Message.created_at >= start_date)
            .group_by("day", Message.sender_type)
            .order_by("day")
        )
        msg_res = (await db.execute(msg_stmt)).all()
        received_by_day = {}
        replies_by_day = {}
        for row in msg_res:
            if not row.day:
                continue
            d_str = row.day.strftime("%Y-%m-%d")
            if row.sender_type == "user":
                received_by_day[d_str] = row.count
            elif row.sender_type in ("ai", "system"):
                replies_by_day[d_str] = replies_by_day.get(d_str, 0) + row.count

        # 3. New users per day
        user_stmt = (
            select(
                func.date_trunc("day", Profile.created_at).label("day"),
                func.count(Profile.id).label("count"),
            )
            .where(Profile.created_at >= start_date)
            .group_by("day")
            .order_by("day")
        )
        user_res = (await db.execute(user_stmt)).all()
        users_by_day = {row.day.strftime("%Y-%m-%d"): row.count for row in user_res if row.day}

        # Build continuous timeline
        timeline = []
        for i in range(days + 1):
            curr = start_date + timedelta(days=i)
            key = curr.strftime("%Y-%m-%d")
            label = curr.strftime("%b %d")
            timeline.append({
                "date": key,
                "label": label,
                "conversations": conv_by_day.get(key, 0),
                "messages_received": received_by_day.get(key, 0),
                "bot_replies": replies_by_day.get(key, 0),
                "new_users": users_by_day.get(key, 0),
            })

        return {"timeline": timeline}

    @staticmethod
    async def get_telegram_users(
        db: AsyncSession,
        q: Optional[str] = None,
        has_phone: Optional[bool] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[TelegramUserItem], int]:
        """Fetch Telegram users with search, filtering, and interaction stats."""
        base_query = select(Profile).where(Profile.telegram_id.isnot(None))

        if q:
            term = f"%{q.strip()}%"
            # If search term is numeric, allow searching by telegram_id
            conds = [
                Profile.full_name.ilike(term),
                Profile.first_name.ilike(term),
                Profile.last_name.ilike(term),
                Profile.telegram_username.ilike(term),
                Profile.email.ilike(term),
            ]
            if q.strip().isdigit():
                conds.append(Profile.telegram_id == int(q.strip()))
            # Only search phone if query looks like phone digits
            if any(c.isdigit() for c in q) and len(q.strip()) >= 4:
                conds.append(Profile.phone_number.ilike(term))
            base_query = base_query.where(or_(*conds))

        if has_phone is True:
            base_query = base_query.where(Profile.phone_number.isnot(None))
        elif has_phone is False:
            base_query = base_query.where(Profile.phone_number.is_(None))

        if status == "active":
            base_query = base_query.where(Profile.is_active == True)
        elif status == "inactive":
            base_query = base_query.where(Profile.is_active == False)

        total_stmt = select(func.count()).select_from(base_query.subquery())
        total = await db.scalar(total_stmt) or 0

        stmt = (
            base_query
            .order_by(desc(Profile.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        res = await db.execute(stmt)
        profiles = list(res.scalars().all())

        user_items: List[TelegramUserItem] = []
        for p in profiles:
            # Query message and conversation counts
            conv_count = await db.scalar(
                select(func.count(Conversation.id)).where(Conversation.user_id == p.id)
            ) or 0

            msg_count = await db.scalar(
                select(func.count(Message.id))
                .join(Conversation, Message.conversation_id == Conversation.id)
                .where(Conversation.user_id == p.id, Message.sender_type == "user")
            ) or 0

            # Last interaction and preview
            last_msg_row = (await db.execute(
                select(Message.content, Message.created_at)
                .join(Conversation, Message.conversation_id == Conversation.id)
                .where(Conversation.user_id == p.id)
                .order_by(desc(Message.created_at))
                .limit(1)
            )).first()

            last_preview = last_msg_row[0][:80] if last_msg_row else None
            last_time = last_msg_row[1] if last_msg_row else p.created_at

            user_items.append(
                TelegramUserItem(
                    id=p.id,
                    telegram_id=p.telegram_id,
                    telegram_username=p.telegram_username,
                    first_name=p.first_name,
                    last_name=p.last_name,
                    full_name=p.full_name or f"{p.first_name or ''} {p.last_name or ''}".strip() or p.telegram_username or "Telegram User",
                    email=p.email,
                    phone_number=p.phone_number,
                    phone_shared_at=p.phone_shared_at,
                    first_interaction=p.created_at,
                    last_interaction=last_time,
                    total_messages_sent=int(msg_count),
                    total_conversations=int(conv_count),
                    last_message_preview=last_preview,
                    status="active" if p.is_active else "inactive",
                )
            )

        return user_items, int(total)

    @staticmethod
    async def get_user_detail(db: AsyncSession, user_id: UUID) -> Optional[TelegramUserItem]:
        """Fetch detailed information for a single Telegram user."""
        stmt = select(Profile).where(Profile.id == user_id)
        res = await db.execute(stmt)
        p = res.scalar_one_or_none()
        if not p:
            return None

        conv_count = await db.scalar(
            select(func.count(Conversation.id)).where(Conversation.user_id == p.id)
        ) or 0

        msg_count = await db.scalar(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == p.id, Message.sender_type == "user")
        ) or 0

        last_msg_row = (await db.execute(
            select(Message.content, Message.created_at)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == p.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )).first()

        last_preview = last_msg_row[0] if last_msg_row else None
        last_time = last_msg_row[1] if last_msg_row else p.created_at

        return TelegramUserItem(
            id=p.id,
            telegram_id=p.telegram_id,
            telegram_username=p.telegram_username,
            first_name=p.first_name,
            last_name=p.last_name,
            full_name=p.full_name or f"{p.first_name or ''} {p.last_name or ''}".strip() or p.telegram_username or "Telegram User",
            email=p.email,
            phone_number=p.phone_number,
            phone_shared_at=p.phone_shared_at,
            first_interaction=p.created_at,
            last_interaction=last_time,
            total_messages_sent=int(msg_count),
            total_conversations=int(conv_count),
            last_message_preview=last_preview,
            status="active" if p.is_active else "inactive",
        )

    @staticmethod
    async def get_user_messages(db: AsyncSession, user_id: UUID, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve full chronological conversation history for a user."""
        stmt = (
            select(Message)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == user_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        messages = res.scalars().all()
        return [
            {
                "id": str(m.id),
                "conversation_id": str(m.conversation_id),
                "sender_type": m.sender_type,
                "content": m.content,
                "message_type": m.message_type,
                "response_time_ms": m.response_time_ms,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]

    @staticmethod
    async def get_live_conversations(
        db: AsyncSession,
        q: Optional[str] = None,
        status: Optional[str] = None,
        handling_mode: Optional[str] = None,
        page: int = 1,
        page_size: int = 30,
    ) -> Tuple[List[AdminConversationItem], int]:
        """Fetch live conversations for the 3-panel chat view."""
        base_query = (
            select(Conversation, Profile)
            .join(Profile, Conversation.user_id == Profile.id)
        )

        if q:
            term = f"%{q.strip()}%"
            base_query = base_query.where(
                or_(
                    Profile.full_name.ilike(term),
                    Profile.telegram_username.ilike(term),
                    Conversation.title.ilike(term),
                )
            )

        if status:
            base_query = base_query.where(Conversation.status == status)

        if handling_mode:
            base_query = base_query.where(Conversation.handling_mode == handling_mode)

        total_stmt = select(func.count()).select_from(base_query.subquery())
        total = await db.scalar(total_stmt) or 0

        stmt = (
            base_query
            .order_by(desc(Conversation.updated_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        res = await db.execute(stmt)
        rows = res.all()

        items: List[AdminConversationItem] = []
        for conv, prof in rows:
            # Last message in conversation
            last_m = (await db.execute(
                select(Message.content, Message.created_at)
                .where(Message.conversation_id == conv.id)
                .order_by(desc(Message.created_at))
                .limit(1)
            )).first()

            items.append(
                AdminConversationItem(
                    id=conv.id,
                    user_id=prof.id,
                    user_name=prof.full_name or prof.telegram_username or "User",
                    telegram_username=prof.telegram_username,
                    telegram_id=prof.telegram_id,
                    phone_number=prof.phone_number,
                    platform=conv.platform,
                    platform_conversation_id=conv.platform_conversation_id,
                    title=conv.title or "General Conversation",
                    status=conv.status,
                    handling_mode=conv.handling_mode,
                    message_count=conv.message_count,
                    last_message_text=last_m[0][:120] if last_m else None,
                    last_message_time=last_m[1] if last_m else conv.updated_at,
                    created_at=conv.created_at,
                )
            )

        return items, int(total)

    @staticmethod
    async def get_conversation_detail(db: AsyncSession, conversation_id: UUID) -> Optional[AdminConversationDetail]:
        """Fetch conversation, messages, and associated user profile."""
        stmt = (
            select(Conversation, Profile)
            .join(Profile, Conversation.user_id == Profile.id)
            .where(Conversation.id == conversation_id)
        )
        res = await db.execute(stmt)
        row = res.first()
        if not row:
            return None

        conv, prof = row

        # Fetch messages
        m_stmt = (
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
        )
        messages = list((await db.execute(m_stmt)).scalars().all())

        user_profile = await AdminDashboardService.get_user_detail(db, prof.id)
        if not user_profile:
            return None

        last_m = messages[-1] if messages else None

        conv_item = AdminConversationItem(
            id=conv.id,
            user_id=prof.id,
            user_name=prof.full_name or prof.telegram_username or "User",
            telegram_username=prof.telegram_username,
            telegram_id=prof.telegram_id,
            phone_number=prof.phone_number,
            platform=conv.platform,
            platform_conversation_id=conv.platform_conversation_id,
            title=conv.title or "General Conversation",
            status=conv.status,
            handling_mode=conv.handling_mode,
            message_count=len(messages),
            last_message_text=last_m.content[:120] if last_m else None,
            last_message_time=last_m.created_at if last_m else conv.updated_at,
            created_at=conv.created_at,
        )

        return AdminConversationDetail(
            conversation=conv_item,
            messages=[
                {
                    "id": str(m.id),
                    "sender_type": m.sender_type,
                    "content": m.content,
                    "message_type": m.message_type,
                    "processing_status": m.processing_status,
                    "response_time_ms": m.response_time_ms,
                    "created_at": m.created_at.isoformat(),
                }
                for m in messages
            ],
            user_profile=user_profile,
        )

    @staticmethod
    async def poll_conversation_messages(
        db: AsyncSession, conversation_id: UUID, since: datetime
    ) -> List[Dict[str, Any]]:
        """Return messages created after a given timestamp for real-time polling."""
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id, Message.created_at > since)
            .order_by(Message.created_at.asc())
        )
        messages = (await db.execute(stmt)).scalars().all()
        return [
            {
                "id": str(m.id),
                "sender_type": m.sender_type,
                "content": m.content,
                "message_type": m.message_type,
                "processing_status": m.processing_status,
                "response_time_ms": m.response_time_ms,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]

    @staticmethod
    async def get_bot_status(db: AsyncSession) -> BotHealthResponse:
        """Measure database latency, check Ollama, and return comprehensive system health."""
        settings = get_settings()

        # Database latency measurement
        t0 = time.perf_counter()
        db_status = "connected"
        try:
            await db.execute(text("SELECT 1"))
            db_latency = (time.perf_counter() - t0) * 1000
        except Exception:
            db_status = "error"
            db_latency = -1.0

        # Ollama health
        ollama_available = False
        installed_models = []
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                r = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
                if r.status_code == 200:
                    ollama_available = True
                    installed_models = [m.get("name") for m in r.json().get("models", [])]
        except Exception:
            ollama_available = False

        # Last message timestamp
        last_msg_time = await db.scalar(
            select(func.max(Message.created_at))
        )

        # Recent errors count (analytics events with 'error' or failed messages)
        failed_msgs = await db.scalar(
            select(func.count(Message.id)).where(Message.processing_status == "failed")
        ) or 0

        return BotHealthResponse(
            bot_name="AIVA Virtual Assistant",
            bot_username="AIVA_LPU_bot",
            bot_status="active",
            api_status="healthy",
            database_status=db_status,
            database_latency_ms=round(db_latency, 2),
            model_provider="Groq Cloud" if settings.GROQ_API_KEY else "Ollama Local",
            model_name=settings.GROQ_MODEL if settings.GROQ_API_KEY else settings.OLLAMA_MODEL,
            last_message_at=last_msg_time,
            recent_errors_count=int(failed_msgs),
            ollama_available=ollama_available,
            installed_models=installed_models,
        )

    @staticmethod
    async def export_users_csv(db: AsyncSession, admin_id: UUID, ip_address: Optional[str] = None) -> bytes:
        """Export sanitized Telegram users directory with contact details for authorized staff."""
        # Log administrative audit
        audit = AdminAuditLog(
            admin_id=admin_id,
            action="export_users_csv",
            ip_address=ip_address,
            details={"timestamp": datetime.now(timezone.utc).isoformat()},
        )
        db.add(audit)
        await db.flush()

        stmt = (
            select(Profile)
            .where(Profile.telegram_id.isnot(None))
            .order_by(desc(Profile.created_at))
        )
        res = await db.execute(stmt)
        profiles = res.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "telegram_id",
            "full_name",
            "first_name",
            "last_name",
            "telegram_username",
            "phone_number",
            "phone_shared_at",
            "status",
            "created_at",
        ])

        for p in profiles:
            writer.writerow([
                p.telegram_id,
                p.full_name or "",
                p.first_name or "",
                p.last_name or "",
                p.telegram_username or "",
                p.phone_number if p.phone_number else "Not shared",
                p.phone_shared_at.isoformat() if p.phone_shared_at else "",
                "active" if p.is_active else "inactive",
                p.created_at.isoformat(),
            ])

        return output.getvalue().encode("utf-8")
