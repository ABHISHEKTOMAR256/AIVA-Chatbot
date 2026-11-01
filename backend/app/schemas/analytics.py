"""Analytics / dashboard schemas."""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class DashboardStats(BaseModel):
    """Aggregate dashboard counters."""

    total_users: int = 0
    total_conversations: int = 0
    total_messages: int = 0
    total_complaints: int = 0
    open_complaints: int = 0
    resolved_complaints: int = 0
    pending_handovers: int = 0
    avg_response_time_ms: Optional[float] = None
    conversations_today: int = 0
    conversations_this_week: int = 0


class ConversationProgress(BaseModel):
    """Track progress toward the 25-genuine-conversation goal."""

    total_genuine: int
    target: int = 25
    percentage: float
    remaining: int


class DailyStats(BaseModel):
    """Metrics for a single day."""

    date: date
    conversations: int = 0
    messages: int = 0
    complaints: int = 0


class AnalyticsExport(BaseModel):
    """Export request parameters."""

    format: str = "csv"
