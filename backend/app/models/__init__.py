"""SQLAlchemy models package — import all models so Alembic can discover them."""

from app.models.base import BaseModel  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.complaint import Complaint  # noqa: F401
from app.models.media_file import MediaFile  # noqa: F401
from app.models.handover_request import HandoverRequest  # noqa: F401
from app.models.feedback import Feedback  # noqa: F401
from app.models.analytics_event import AnalyticsEvent  # noqa: F401
from app.models.lost_found_item import LostFoundItem  # noqa: F401
from app.models.knowledge_document import KnowledgeDocument  # noqa: F401
from app.models.audit_log import AdminAuditLog  # noqa: F401
