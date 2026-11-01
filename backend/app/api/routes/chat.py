"""Chat and conversation routes."""

from __future__ import annotations

import time
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.feedback import Feedback
from app.schemas.auth import UserInfo
from app.schemas.conversation import (
    ConversationCreate,
    ConversationListResponse,
    ConversationResponse,
)
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.schemas.message import ChatRequest, ChatResponse, MessageResponse
from app.services.ai_service import AIService
from app.services.conversation_service import ConversationService
from app.services.rag_service import RAGService

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Send a message to AIVA, retrieve RAG context, and get AI response."""
    conv_service = ConversationService()
    settings = get_settings()

    # 1. Resolve or create conversation
    if payload.conversation_id:
        conversation = await conv_service.get_conversation(
            db, payload.conversation_id, current_user.id
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Generate initial title from first 5-6 words
        preview = " ".join(payload.message.split()[:5])[:40] or "New Chat"
        conversation = await conv_service.create_conversation(
            db,
            user_id=current_user.id,
            platform="web",
            title=preview,
        )

    # 2. Save user message
    user_msg = await conv_service.add_message(
        db,
        conversation_id=conversation.id,
        sender_type="user",
        content=payload.message,
    )

    # 3. If in human handover mode, acknowledge without invoking AI
    if conversation.handling_mode in ("human", "pending_handover"):
        reply_text = (
            "⏳ Your message has been received by hostel staff. "
            "A staff member will reply here shortly."
        )
        staff_ack = await conv_service.add_message(
            db,
            conversation_id=conversation.id,
            sender_type="system",
            content=reply_text,
        )
        return ChatResponse(
            response=reply_text,
            conversation_id=conversation.id,
            message_id=staff_ack.id,
        )

    # 4. RAG Retrieval for relevant hostel rules/FAQ
    rag_service = RAGService(db)
    context_chunks = await rag_service.search_relevant_docs(payload.message, top_k=3)

    # 5. Build prompt & context history
    ai_service = AIService()
    system_prompt = ai_service.build_system_prompt(current_user, context_chunks)
    recent_history = await conv_service.get_context_messages(db, conversation.id, limit=8)

    # 6. Generate AI response with timing
    ai_reply_text, elapsed_ms = await ai_service.generate_response(
        conversation_history=recent_history,
        user_message=payload.message,
        system_prompt=system_prompt,
    )

    # 7. Save AI message
    ai_msg = await conv_service.add_message(
        db,
        conversation_id=conversation.id,
        sender_type="ai",
        content=ai_reply_text,
        ai_model=settings.OLLAMA_MODEL,
        response_time_ms=elapsed_ms,
    )

    return ChatResponse(
        response=ai_reply_text,
        conversation_id=conversation.id,
        message_id=ai_msg.id,
    )


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationListResponse:
    """List authenticated user's conversations with pagination."""
    conv_service = ConversationService()
    conversations, total = await conv_service.get_user_conversations(
        db, current_user.id, page=page, page_size=page_size
    )
    return ConversationListResponse(
        conversations=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/conversations/{conversation_id}")
async def get_conversation_details(
    conversation_id: UUID,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve full conversation details and its messages."""
    conv_service = ConversationService()
    conversation = await conv_service.get_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await conv_service.get_conversation_messages(db, conversation_id, limit=100)
    return {
        "conversation": ConversationResponse.model_validate(conversation),
        "messages": [MessageResponse.model_validate(m) for m in messages],
    }


@router.post("/conversations/{conversation_id}/close", response_model=ConversationResponse)
async def close_conversation(
    conversation_id: UUID,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """Close an active conversation."""
    conv_service = ConversationService()
    conversation = await conv_service.close_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse.model_validate(conversation)


@router.post("/conversations/{conversation_id}/feedback", response_model=FeedbackResponse)
async def submit_conversation_feedback(
    conversation_id: UUID,
    payload: FeedbackCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    """Submit 1-5 star user feedback for a conversation."""
    conv_service = ConversationService()
    conversation = await conv_service.get_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    feedback = Feedback(
        conversation_id=conversation_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return FeedbackResponse.model_validate(feedback)
