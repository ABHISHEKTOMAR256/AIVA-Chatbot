"""Conversation & message business logic."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.conversation import Conversation
from app.models.message import Message

logger = get_logger("app")


class ConversationService:
    """CRUD + helpers for conversations and their messages."""

    # ── Conversation CRUD ─────────────────────────────────────

    @staticmethod
    async def create_conversation(
        db: AsyncSession,
        user_id: UUID,
        platform: str = "web",
        title: Optional[str] = None,
    ) -> Conversation:
        """Create a new conversation thread."""
        conv = Conversation(
            user_id=user_id,
            platform=platform,
            title=title or "New conversation",
            status="active",
            handling_mode="ai",
            message_count=0,
        )
        db.add(conv)
        await db.flush()
        logger.info("Conversation %s created for user %s on %s", conv.id, user_id, platform)
        return conv

    @staticmethod
    async def get_or_create_conversation(
        db: AsyncSession,
        user_id: UUID,
        platform: str = "web",
        platform_conv_id: Optional[str] = None,
        platform_conversation_id: Optional[str] = None,
    ) -> Conversation:
        """Find an active conversation or create a new one.

        For Telegram, looks up by ``platform_conversation_id``.
        For web, returns the most recent active conversation or creates one.
        """
        pid = platform_conv_id or platform_conversation_id
        stmt = (
            select(Conversation)
            .where(
                Conversation.user_id == user_id,
                Conversation.status == "active",
                Conversation.platform == platform,
            )
        )
        if pid:
            stmt = stmt.where(
                Conversation.platform_conversation_id == pid
            )
        stmt = stmt.order_by(Conversation.created_at.desc()).limit(1)

        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()

        if conv is not None:
            return conv

        conv = Conversation(
            user_id=user_id,
            platform=platform,
            platform_conversation_id=pid,
            title="New conversation",
            status="active",
            handling_mode="ai",
            message_count=0,
        )
        db.add(conv)
        await db.flush()
        return conv

    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: Optional[UUID] = None,
    ) -> Optional[Conversation]:
        """Fetch a conversation (optionally verify ownership)."""
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        if user_id is not None:
            stmt = stmt.where(Conversation.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_conversations(
        db: AsyncSession,
        user_id: UUID,
    ) -> List[Conversation]:
        """List all conversations for a user, newest first."""
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    # ── Messages ──────────────────────────────────────────────

    @staticmethod
    async def add_message(
        db: AsyncSession,
        conversation_id: UUID,
        sender_type: str,
        content: str,
        message_type: str = "text",
        ai_model: Optional[str] = None,
        response_time_ms: Optional[int] = None,
        telegram_message_id: Optional[int] = None,
    ) -> Message:
        """Insert a message and bump the conversation's message_count.

        De-duplicates Telegram messages by ``telegram_message_id``.
        """
        # Telegram dedup
        if telegram_message_id is not None:
            existing = await db.execute(
                select(Message).where(
                    Message.conversation_id == conversation_id,
                    Message.telegram_message_id == telegram_message_id,
                )
            )
            dup = existing.scalar_one_or_none()
            if dup is not None:
                logger.debug("Duplicate telegram_message_id %d — skipping", telegram_message_id)
                return dup

        msg = Message(
            conversation_id=conversation_id,
            sender_type=sender_type,
            content=content,
            message_type=message_type,
            ai_model=ai_model,
            response_time_ms=response_time_ms,
            processing_status="processed",
            telegram_message_id=telegram_message_id,
        )
        db.add(msg)

        # Increment message count
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()
        if conv:
            conv.message_count = (conv.message_count or 0) + 1
            conv.updated_at = datetime.now(timezone.utc)

        await db.flush()
        return msg

    @staticmethod
    async def get_conversation_messages(
        db: AsyncSession,
        conversation_id: UUID,
        limit: int = 50,
        before: Optional[datetime] = None,
    ) -> List[Message]:
        """Paginated message list, newest last."""
        stmt = select(Message).where(Message.conversation_id == conversation_id)
        if before:
            stmt = stmt.where(Message.created_at < before)
        stmt = stmt.order_by(Message.created_at.asc()).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_context_messages(
        db: AsyncSession,
        conversation_id: UUID,
        limit: int = 10,
    ) -> List[Dict[str, str]]:
        """Return recent messages formatted as ``[{"role": ..., "content": ...}]`` for the AI."""
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        messages = list(reversed(result.scalars().all()))

        formatted: List[Dict[str, str]] = []
        for m in messages:
            role = "assistant" if m.sender_type in ("ai", "system", "staff") else "user"
            formatted.append({"role": role, "content": m.content})
        return formatted

    # ── Lifecycle helpers ─────────────────────────────────────

    @staticmethod
    async def close_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
    ) -> Optional[Conversation]:
        """Mark a conversation as closed."""
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()
        if conv:
            conv.status = "closed"
            conv.updated_at = datetime.now(timezone.utc)
            await db.flush()
        return conv

    @staticmethod
    async def set_handling_mode(
        db: AsyncSession,
        conversation_id: UUID,
        mode: str,
    ) -> Optional[Conversation]:
        """Switch handling mode (ai / human / pending_handover)."""
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()
        if conv:
            conv.handling_mode = mode
            conv.updated_at = datetime.now(timezone.utc)
            await db.flush()
        return conv
