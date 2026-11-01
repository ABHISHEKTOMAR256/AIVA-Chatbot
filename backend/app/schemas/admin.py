"""Admin-specific schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AdminUserResponse(BaseModel):
    """User record for admin listing."""

    id: UUID
    email: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    phone_shared_at: Optional[datetime] = None
    role: str
    is_active: bool
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminLoginRequest(BaseModel):
    """Admin login credentials."""

    username_or_email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class AdminLoginResponse(BaseModel):
    """Admin authentication reply."""

    access_token: str
    token_type: str = "bearer"
    user: AdminUserResponse


class TelegramDashboardStats(BaseModel):
    """High-level real-time KPI metrics for the 3D dashboard."""

    total_telegram_users: int
    total_conversations: int
    total_messages_received: int
    total_bot_replies: int
    active_users_today: int
    active_users_7d: int
    avg_response_time_ms: float
    failed_messages: int
    bot_online: bool
    bot_username: str
    uptime_seconds: Optional[int] = None


class TelegramUserItem(BaseModel):
    """Rich Telegram user details for administration."""

    id: UUID
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: str
    phone_number: Optional[str] = None
    phone_shared_at: Optional[datetime] = None
    first_interaction: datetime
    last_interaction: Optional[datetime] = None
    total_messages_sent: int = 0
    total_conversations: int = 0
    last_message_preview: Optional[str] = None
    status: str = "active"


class TelegramUserListResponse(BaseModel):
    """Paginated users list."""

    users: List[TelegramUserItem]
    total: int
    page: int = 1
    page_size: int = 20


class AdminConversationItem(BaseModel):
    """Conversation summary for admin live view."""

    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    telegram_username: Optional[str] = None
    telegram_id: Optional[int] = None
    phone_number: Optional[str] = None
    platform: str
    platform_conversation_id: Optional[str] = None
    title: Optional[str] = None
    status: str
    handling_mode: str
    message_count: int
    last_message_text: Optional[str] = None
    last_message_time: Optional[datetime] = None
    created_at: datetime


class AdminConversationDetail(BaseModel):
    """Detailed conversation view with full message stream and metadata."""

    conversation: AdminConversationItem
    messages: List[dict]
    user_profile: TelegramUserItem


class BotHealthResponse(BaseModel):
    """System and bot status monitoring."""

    bot_name: str
    bot_username: str
    bot_status: str
    api_status: str
    database_status: str
    database_latency_ms: float
    model_provider: str
    model_name: str
    last_message_at: Optional[datetime] = None
    recent_errors_count: int = 0
    ollama_available: bool = False
    installed_models: List[str] = []


class AdminUserList(BaseModel):
    """Paginated user list for admin."""

    users: List[AdminUserResponse]
    total: int
    page: int = 1
    page_size: int = 20


class AdminComplaintFilter(BaseModel):
    """Query filters for admin complaint listing."""

    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class StaffAssignment(BaseModel):
    """Assign a staff member to a complaint."""

    complaint_id: UUID
    staff_id: UUID


class KnowledgeDocCreate(BaseModel):
    """Payload to add a knowledge-base document."""

    title: str = Field(..., min_length=3, max_length=512)
    content: str = Field(..., min_length=10)
    category: str = Field(..., description="rules, faq, procedures, or facilities")


class KnowledgeDocResponse(BaseModel):
    """Knowledge document representation."""

    id: UUID
    title: str
    content: str
    category: str
    chunk_index: int
    is_active: bool
    uploaded_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ManualReplyRequest(BaseModel):
    """Payload to send manual reply to conversation."""

    content: str = Field(..., min_length=1, max_length=4000)


class ModeUpdateRequest(BaseModel):
    """Payload to switch conversation handling mode."""

    mode: str = Field(..., description="ai, human, or pending_handover")


class AdminMediaItem(BaseModel):
    """Media file detail for admin gallery."""

    id: UUID
    filename: str
    stored_filename: str
    mime_type: str
    file_size: int
    storage_path: str
    bucket_name: str
    signed_url: Optional[str] = None
    user_id: UUID
    user_name: Optional[str] = None
    telegram_username: Optional[str] = None
    complaint_id: Optional[UUID] = None
    lost_found_item_id: Optional[UUID] = None
    created_at: datetime


class AdminSessionItem(BaseModel):
    """Active session for administration."""

    id: UUID
    user_id: UUID
    user_name: str
    telegram_username: Optional[str] = None
    telegram_id: Optional[int] = None
    platform: str
    status: str
    handling_mode: str
    message_count: int
    created_at: datetime
    updated_at: datetime

