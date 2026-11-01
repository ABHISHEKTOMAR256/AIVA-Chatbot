"""Admin dashboard, complaint handling, handover, and analytics routes."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    check_login_rate_limit,
    create_admin_access_token,
    get_current_admin,
    record_login_failure,
    reset_login_attempts,
    verify_password,
)
from app.models.audit_log import AdminAuditLog
from app.models.knowledge_document import KnowledgeDocument
from app.models.profile import Profile
from app.schemas.admin import (
    AdminComplaintFilter,
    AdminConversationDetail,
    AdminConversationItem,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminMediaItem,
    AdminSessionItem,
    AdminUserList,
    AdminUserResponse,
    BotHealthResponse,
    KnowledgeDocCreate,
    KnowledgeDocResponse,
    ManualReplyRequest,
    ModeUpdateRequest,
    TelegramDashboardStats,
    TelegramUserItem,
    TelegramUserListResponse,
)
from app.schemas.analytics import ConversationProgress, DailyStats, DashboardStats
from app.schemas.auth import UserInfo
from app.schemas.complaint import ComplaintCreate, ComplaintListResponse, ComplaintResponse, ComplaintUpdate
from app.schemas.handover import HandoverReply, HandoverResponse
from app.schemas.lost_found import LostFoundCreate, LostFoundResponse
from app.schemas.message import MessageResponse
from app.services.admin_dashboard_service import AdminDashboardService
from app.services.analytics_service import AnalyticsService
from app.services.complaint_service import ComplaintService
from app.services.handover_service import HandoverService
from app.services.lost_found_service import LostFoundService
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


# ── 3D Futuristic Admin Dashboard Endpoints ─────────────────────────────────

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    payload: AdminLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AdminLoginResponse:
    """Secure server-side authentication for the 3D Admin Dashboard.

    Includes brute-force rate-limiting, bcrypt verification, and HTTP-only cookie setting.
    """
    client_ip = request.client.host if request.client else "unknown"

    # Rate limiting check
    if not check_login_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait 15 minutes before trying again.",
        )

    # Lookup user by email or username
    stmt = select(Profile).where(
        or_(
            Profile.email == payload.username_or_email.strip().lower(),
            Profile.telegram_username == payload.username_or_email.strip(),
        )
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        record_login_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Access denied.",
        )

    if user.role not in ("admin", "staff", "warden"):
        record_login_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not have administrator privileges.",
        )

    # Success: reset rate limiter
    reset_login_attempts(client_ip)

    # Generate JWT
    token = create_admin_access_token(
        user_id=str(user.id),
        role=user.role,
        email=user.email,
    )

    # Set HTTP-only, Secure (in production), SameSite cookie
    response.set_cookie(
        key="aiva_admin_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=12 * 3600,
        path="/",
    )

    # Record audit log
    audit = AdminAuditLog(
        admin_id=user.id,
        action="admin_login",
        ip_address=client_ip,
        details={"email": user.email, "timestamp": datetime.now(timezone.utc).isoformat()},
    )
    db.add(audit)
    await db.commit()

    return AdminLoginResponse(
        access_token=token,
        token_type="bearer",
        user=AdminUserResponse.model_validate(user),
    )


@router.post("/logout")
async def admin_logout(
    response: Response,
    admin: UserInfo = Depends(get_current_admin),
) -> dict:
    """Clear admin session cookie."""
    response.delete_cookie(key="aiva_admin_token", path="/")
    return {"message": "Admin session terminated successfully."}


@router.get("/me", response_model=AdminUserResponse)
async def get_admin_profile(
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserResponse:
    """Fetch current authenticated administrator profile."""
    prof = await db.get(Profile, admin.id)
    if not prof:
        raise HTTPException(status_code=404, detail="Admin user record not found")
    return AdminUserResponse.model_validate(prof)


@router.get("/stats", response_model=TelegramDashboardStats)
async def get_telegram_dashboard_stats(
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> TelegramDashboardStats:
    """Real-time database aggregated stats for 3D Overview cards."""
    return await AdminDashboardService.get_dashboard_stats(db)


@router.get("/analytics/charts")
async def get_analytics_charts_timeline(
    days: int = Query(14, ge=1, le=90),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve daily time-series metrics for interactive charts."""
    return await AdminDashboardService.get_analytics_charts(db, days=days)


@router.get("/telegram/users", response_model=TelegramUserListResponse)
async def list_telegram_users(
    q: Optional[str] = Query(None, description="Search by name, username, telegram ID, or phone"),
    has_phone: Optional[bool] = Query(None, description="Filter users who shared phone numbers"),
    status: Optional[str] = Query(None, description="Filter active/inactive"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> TelegramUserListResponse:
    """Paginated list of Telegram users with phone consent status and message counts."""
    users, total = await AdminDashboardService.get_telegram_users(
        db, q=q, has_phone=has_phone, status=status, page=page, page_size=page_size
    )
    return TelegramUserListResponse(users=users, total=total, page=page, page_size=page_size)


@router.get("/telegram/users/export/csv")
async def export_telegram_users_csv(
    request: Request,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Export sanitized Telegram student directory to CSV with audit trail."""
    client_ip = request.client.host if request.client else "unknown"
    csv_bytes = await AdminDashboardService.export_users_csv(db, admin_id=admin.id, ip_address=client_ip)
    await db.commit()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="aiva_users_{timestamp}.csv"'},
    )


@router.get("/telegram/users/{user_id}", response_model=TelegramUserItem)
async def get_telegram_user_detail(
    user_id: UUID,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> TelegramUserItem:
    """Get single Telegram user profile with contact details and activity."""
    user = await AdminDashboardService.get_user_detail(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/telegram/users/{user_id}/messages")
async def get_telegram_user_messages(
    user_id: UUID,
    limit: int = Query(100, ge=1, le=500),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Retrieve complete chronological message history for a given user."""
    return await AdminDashboardService.get_user_messages(db, user_id=user_id, limit=limit)


@router.get("/live/conversations")
async def get_live_conversations(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    handling_mode: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve live conversations list for the 3-panel chat view."""
    items, total = await AdminDashboardService.get_live_conversations(
        db, q=q, status=status, handling_mode=handling_mode, page=page, page_size=page_size
    )
    return {"conversations": items, "total": total, "page": page, "page_size": page_size}


@router.get("/live/conversations/{conversation_id}", response_model=AdminConversationDetail)
async def get_live_conversation_detail(
    conversation_id: UUID,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminConversationDetail:
    """Retrieve single conversation details with full message stream and sender profile."""
    detail = await AdminDashboardService.get_conversation_detail(db, conversation_id=conversation_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return detail


@router.get("/live/conversations/{conversation_id}/poll")
async def poll_conversation_messages(
    conversation_id: UUID,
    since: str = Query(..., description="ISO 8601 timestamp to poll messages after"),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Poll for new messages in a conversation after a timestamp."""
    try:
        dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ISO timestamp format")

    messages = await AdminDashboardService.poll_conversation_messages(db, conversation_id=conversation_id, since=dt)
    return {"messages": messages}


@router.get("/bot/status", response_model=BotHealthResponse)
async def get_bot_health_status(
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> BotHealthResponse:
    """Live status of Telegram Bot, PostgreSQL DB latency, and Ollama/Groq inference."""
    return await AdminDashboardService.get_bot_status(db)


@router.get("/guest/preview")
async def get_guest_preview() -> Dict[str, Any]:
    """Public non-sensitive preview metrics and sample data for Guest Mode.

    Allows unauthenticated visitors to explore the 3D control room without accessing private records.
    """
    return AdminDashboardService.get_guest_preview_data()


@router.post("/conversations/{conversation_id}/manual-reply")
async def send_manual_reply(
    conversation_id: UUID,
    payload: ManualReplyRequest,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Send manual reply directly from admin control center to Telegram/Web user."""
    try:
        return await AdminDashboardService.send_manual_reply(
            db=db,
            conversation_id=conversation_id,
            content=payload.content,
            admin_id=admin.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/conversations/{conversation_id}/mode")
async def update_conversation_mode(
    conversation_id: UUID,
    payload: ModeUpdateRequest,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Switch conversation handling mode between 'ai', 'human', and 'pending_handover'."""
    try:
        return await AdminDashboardService.update_conversation_mode(
            db=db,
            conversation_id=conversation_id,
            mode=payload.mode,
            admin_id=admin.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/media", response_model=Dict[str, Any])
async def list_admin_media(
    q: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """List all uploaded media files with signed URLs for authorized staff."""
    files, total = await AdminDashboardService.get_admin_media_files(
        db, q=q, file_type=file_type, page=page, page_size=page_size
    )
    return {"media": files, "total": total, "page": page, "page_size": page_size}


@router.get("/sessions", response_model=Dict[str, Any])
async def list_admin_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """List all active conversation sessions and telemetry for the sessions monitor."""
    sessions, total = await AdminDashboardService.get_admin_sessions(
        db, page=page, page_size=page_size
    )
    return {"sessions": sessions, "total": total, "page": page, "page_size": page_size}


@router.get("/lost-found", response_model=List[LostFoundResponse])
async def list_admin_lost_found(
    query: Optional[str] = Query(None),
    item_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> List[LostFoundResponse]:
    """Admin view for all lost & found items including private reporter details."""
    items = await LostFoundService.search_items(
        db, query=query, item_type=item_type, category=category, status=status
    )
    return [LostFoundResponse.model_validate(i) for i in items]


@router.post("/lost-found", response_model=LostFoundResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_lost_found(
    payload: LostFoundCreate,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> LostFoundResponse:
    """Admin manually logs a lost or found report."""
    item = await LostFoundService.create_item(db, user_id=admin.id, data=payload)
    await db.commit()
    await db.refresh(item)
    return LostFoundResponse.model_validate(item)


@router.patch("/lost-found/{item_id}", response_model=LostFoundResponse)
async def update_admin_lost_found_status(
    item_id: UUID,
    payload: dict,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> LostFoundResponse:
    """Admin updates status of a lost or found item (e.g. 'claimed', 'returned', 'resolved')."""
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    from app.models.lost_found_item import LostFoundItem
    item = await db.get(LostFoundItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.status = new_status
    if new_status in ("claimed", "returned", "resolved"):
        item.resolved_at = datetime.now(timezone.utc)

    # Log audit
    audit = AdminAuditLog(
        admin_id=admin.id,
        action="update_lost_found_status",
        target_id=str(item.id),
        details={"new_status": new_status},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(item)
    return LostFoundResponse.model_validate(item)


@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_complaint(
    payload: ComplaintCreate,
    admin: UserInfo = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Admin manually creates a hostel complaint record."""
    complaint = await ComplaintService().create_complaint(
        db, user_id=admin.id, data=payload
    )
    await db.commit()
    await db.refresh(complaint)
    return ComplaintResponse.model_validate(complaint)


