"""RAG service — sentence-transformer embeddings + pgvector search."""

from __future__ import annotations

import logging
from typing import List, Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.knowledge_document import KnowledgeDocument

logger = get_logger("ai")

# Lazy-loaded model singleton
_model = None


def _get_model():
    """Load the sentence-transformer model on first use."""
    global _model
    if _model is None:
        try:
            logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2) …")
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence-transformers model loaded.")
        except ImportError:
            logger.warning("sentence-transformers is not installed; RAG embedding will fallback to keyword matching.")
            return None
    return _model


class RAGService:
    """Retrieval-Augmented Generation helper backed by pgvector."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Embedding ─────────────────────────────────────────────

    def get_embedding(self, text_input: str) -> List[float]:
        """Generate a 384-dim embedding for *text_input*."""
        model = _get_model()
        if model is None:
            return [0.0] * 384
        try:
            embedding = model.encode(text_input, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.warning(f"Error generating embedding: {e}")
            return [0.0] * 384

    # ── Text chunking ─────────────────────────────────────────

    @staticmethod
    def chunk_text(
        text_body: str,
        chunk_size: int = 500,
        overlap: int = 50,
    ) -> List[str]:
        """Split *text_body* into overlapping chunks of roughly *chunk_size* characters."""
        if len(text_body) <= chunk_size:
            return [text_body]

        chunks: List[str] = []
        start = 0
        while start < len(text_body):
            end = start + chunk_size
            chunk = text_body[start:end]

            # Try to break at a sentence boundary
            if end < len(text_body):
                last_period = chunk.rfind(".")
                last_newline = chunk.rfind("\n")
                break_at = max(last_period, last_newline)
                if break_at > chunk_size // 2:
                    chunk = text_body[start : start + break_at + 1]
                    end = start + break_at + 1

            chunks.append(chunk.strip())
            start = end - overlap

        return [c for c in chunks if c]

    # ── Ingestion ─────────────────────────────────────────────

    async def ingest_document(
        self,
        title: str,
        content: str,
        category: str,
        uploaded_by: Optional[str] = None,
    ) -> List[KnowledgeDocument]:
        """Chunk, embed, and store a document. Returns created rows."""
        chunks = self.chunk_text(content)
        docs: List[KnowledgeDocument] = []

        for idx, chunk in enumerate(chunks):
            embedding = self.get_embedding(chunk)
            doc = KnowledgeDocument(
                title=title,
                content=chunk,
                category=category,
                chunk_index=idx,
                embedding=embedding,
                is_active=True,
                uploaded_by=uploaded_by,
            )
            self.db.add(doc)
            docs.append(doc)

        await self.db.flush()
        logger.info("Ingested '%s' → %d chunks", title, len(docs))
        return docs

    # ── Retrieval ─────────────────────────────────────────────

    async def search_relevant_docs(
        self,
        query: str,
        top_k: int = 3,
    ) -> List[str]:
        """Return the *top_k* most relevant text chunks for *query*.

        Uses pgvector cosine distance when available, falls back to ILIKE text search.
        """
        model = _get_model()
        if model is None:
            # Fallback keyword match
            try:
                words = [w for w in query.split() if len(w) > 3][:3]
                if not words:
                    return []
                from sqlalchemy import or_
                conditions = [KnowledgeDocument.content.ilike(f"%{w}%") for w in words]
                stmt = (
                    select(KnowledgeDocument.content)
                    .where(KnowledgeDocument.is_active.is_(True), or_(*conditions))
                    .limit(top_k)
                )
                result = await self.db.execute(stmt)
                return [row[0] for row in result.fetchall()]
            except Exception as e:
                logger.warning(f"Keyword search fallback error: {e}")
                return []

        try:
            query_embedding = self.get_embedding(query)
            embedding_literal = "[" + ",".join(str(v) for v in query_embedding) + "]"
            stmt = text(
                """
                SELECT content
                FROM knowledge_documents
                WHERE is_active = true
                ORDER BY embedding <=> :embedding
                LIMIT :top_k
                """
            ).bindparams(
                embedding=embedding_literal,
                top_k=top_k,
            )

            result = await self.db.execute(stmt)
            rows = result.fetchall()
            return [row[0] for row in rows]
        except Exception as e:
            logger.warning(f"Vector search failed (e.g. SQLite test environment): {e}")
            return []
