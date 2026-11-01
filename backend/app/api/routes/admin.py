"""Admin dashboard, complaint handling, handover, and analytics routes."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.knowledge_document import KnowledgeDocument
from app.models.profile import Profile
from app.schemas.admin import (
    AdminComplaintFilter,
    AdminUserList,
    AdminUserResponse,
    KnowledgeDocCreate,
    KnowledgeDocResponse,
)
from app.schemas.analytics import ConversationProgress, DailyStats, DashboardStats
from app.schemas.auth import UserInfo
from app.schemas.complaint import ComplaintListResponse, ComplaintResponse, ComplaintUpdate
from app.schemas.handover import HandoverReply, HandoverResponse
from app.schemas.message import MessageResponse
from app.services.analytics_service import AnalyticsService
from app.services.complaint_service import ComplaintService
from app.services.handover_service import HandoverService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_metrics(
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> DashboardStats:
    """Retrieve real-time database-backed aggregate dashboard statistics."""
    return await AnalyticsService.get_dashboard_stats(db)


@router.get("/analytics/progress", response_model=ConversationProgress)
async def get_conversation_progress(
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ConversationProgress:
    """Track progress toward the 25-genuine-user-conversation requirement."""
    return await AnalyticsService.get_conversation_progress(db)


@router.get("/analytics/daily", response_model=List[DailyStats])
async def get_daily_metrics(
    days: int = Query(30, ge=1, le=90),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> List[DailyStats]:
    """Retrieve daily stats breakdown."""
    return await AnalyticsService.get_daily_stats(db, days=days)


@router.get("/analytics/export")
async def export_analytics_csv(
    include_messages: bool = Query(False),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Export analytics data to CSV with privacy protection."""
    csv_bytes = await AnalyticsService.export_analytics_csv(db, include_messages=include_messages)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="aiva_analytics.csv"'},
    )


@router.get("/users", response_model=AdminUserList)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserList:
    """List registered users with pagination."""
    total = await db.scalar(select(func.count(Profile.id)))
    stmt = (
        select(Profile)
        .order_by(Profile.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    res = await db.execute(stmt)
    profiles = list(res.scalars().all())
    return AdminUserList(
        users=[AdminUserResponse.model_validate(p) for p in profiles],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/complaints", response_model=ComplaintListResponse)
async def list_all_complaints(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ComplaintListResponse:
    """List all complaints across users with filters and status breakdown."""
    complaints, total, counts_by_status = await ComplaintService.get_all_complaints(
        db,
        status=status,
        category=category,
        priority=priority,
        page=page,
        page_size=page_size,
    )
    return ComplaintListResponse(
        complaints=[ComplaintResponse.model_validate(c) for c in complaints],
        total=total,
        page=page,
        page_size=page_size,
        counts_by_status=counts_by_status,
    )


@router.patch("/complaints/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: UUID,
    payload: ComplaintUpdate,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Update complaint status, assignment, internal notes, or staff reply."""
    try:
        updated = await ComplaintService.update_complaint(
            db,
            complaint_id=complaint_id,
            data=payload,
            staff_id=admin.id,
        )
        await db.commit()
        await db.refresh(updated)
        return ComplaintResponse.model_validate(updated)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/handovers", response_model=List[HandoverResponse])
async def list_handovers(
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> List[HandoverResponse]:
    """List pending and active handover requests."""
    handovers = await HandoverService.get_pending_handovers(db)
    return [HandoverResponse.model_validate(h) for h in handovers]


@router.post("/handovers/{handover_id}/claim", response_model=HandoverResponse)
async def claim_handover(
    handover_id: UUID,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> HandoverResponse:
    """Staff member claims an escalated conversation."""
    try:
        claimed = await HandoverService.claim_handover(db, handover_id=handover_id, staff_id=admin.id)
        await db.commit()
        await db.refresh(claimed)
        return HandoverResponse.model_validate(claimed)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/handovers/{handover_id}/reply", response_model=MessageResponse)
async def reply_to_handover(
    handover_id: UUID,
    payload: HandoverReply,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Send staff reply directly to user in the claimed conversation."""
    try:
        msg = await HandoverService.send_staff_reply(
            db, handover_id=handover_id, staff_id=admin.id, message=payload.message
        )
        await db.commit()
        await db.refresh(msg)
        return MessageResponse.model_validate(msg)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/handovers/{handover_id}/resolve")
async def resolve_handover(
    handover_id: UUID,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Resolve handover request and return conversation control to AI mode."""
    try:
        await HandoverService.return_to_ai(db, handover_id=handover_id, staff_id=admin.id)
        await db.commit()
        return {"message": "Handover resolved. Conversation returned to AI mode."}
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/knowledge", response_model=KnowledgeDocResponse, status_code=status.HTTP_201_CREATED)
async def add_knowledge_doc(
    payload: KnowledgeDocCreate,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeDocResponse:
    """Ingest a knowledge document (chunked & embedded for RAG)."""
    rag = RAGService(db)
    docs = await rag.ingest_document(
        title=payload.title,
        content=payload.content,
        category=payload.category,
        uploaded_by=admin.id,
    )
    await db.commit()
    return KnowledgeDocResponse.model_validate(docs[0])


@router.get("/knowledge", response_model=List[KnowledgeDocResponse])
async def list_knowledge_docs(
    category: Optional[str] = Query(None),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> List[KnowledgeDocResponse]:
    """List all knowledge base documents."""
    stmt = select(KnowledgeDocument).where(KnowledgeDocument.is_active == True)
    if category:
        stmt = stmt.where(KnowledgeDocument.category == category)
    stmt = stmt.order_by(KnowledgeDocument.created_at.desc())
    res = await db.execute(stmt)
    return [KnowledgeDocResponse.model_validate(d) for d in res.scalars().all()]


@router.delete("/knowledge/{doc_id}")
async def delete_knowledge_doc(
    doc_id: UUID,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Soft delete a knowledge document."""
    doc = await db.get(KnowledgeDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.is_active = False
    await db.commit()
    return {"message": "Knowledge document deleted"}
