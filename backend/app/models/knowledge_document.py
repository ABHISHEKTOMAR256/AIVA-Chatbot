"""Knowledge-base document model with pgvector embedding."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, GUID

try:
    from pgvector.sqlalchemy import Vector
except ImportError:  # graceful fallback when pgvector isn't installed
    from sqlalchemy import LargeBinary as Vector  # type: ignore[assignment]


class KnowledgeDocument(BaseModel):
    """A chunked knowledge-base document with its sentence-transformer embedding."""

    __tablename__ = "knowledge_documents"

    title: Mapped[str] = mapped_column(String(512), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # rules | faq | procedures | facilities
    chunk_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    embedding = mapped_column(Vector(384), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
