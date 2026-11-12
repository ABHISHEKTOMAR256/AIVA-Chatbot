"""Async SQLAlchemy engine, session factory, and dependency."""

from __future__ import annotations

import asyncio
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
engine_kwargs: dict = {"echo": False}

if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    })
else:
    from sqlalchemy.pool import StaticPool
    engine_kwargs.update({
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    })

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


_db_initialized = False
_init_lock = asyncio.Lock()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session and ensures cleanup."""
    global _db_initialized
    if not _db_initialized:
        async with _init_lock:
            if not _db_initialized:
                await init_db()

    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Verify database connection; automatically activate local SQLite fallback if primary is offline."""
    global engine, async_session_factory, _db_initialized
    from app.core.logging_config import get_logger
    logger = get_logger("database")

    import asyncio
    connected = False

    try:
        # Use short timeout to avoid blocking server boot when remote DB host is unreachable
        async def _check_conn():
            async with engine.begin() as conn:
                await conn.run_sync(lambda c: None)

        await asyncio.wait_for(_check_conn(), timeout=2.5)
        connected = True
        logger.info("Primary database connection verified successfully.")
    except Exception as exc:
        logger.warning(
            "Primary database connection failed or timed out (%s). Activating local persistent SQLite fallback...",
            exc,
        )

    if not connected:
        import os
        from pathlib import Path
        from sqlalchemy.pool import StaticPool
        from app.models.base import Base

        data_dir = Path("data")
        data_dir.mkdir(parents=True, exist_ok=True)
        sqlite_url = "sqlite+aiosqlite:///./data/aiva_local.db"

        fallback_engine = create_async_engine(
            sqlite_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False,
        )

        try:
            # Create all tables on SQLite fallback
            async with fallback_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            # Rebind engine and session factory
            engine = fallback_engine
            async_session_factory.configure(bind=fallback_engine)
            logger.info("Local SQLite database active and ready: %s", sqlite_url)

            # Auto-seed default admin account if not present
            try:
                from app.models.profile import Profile
                from uuid import uuid4
                import bcrypt
                from sqlalchemy import select

                async with async_session_factory() as session:
                    res = await session.execute(select(Profile).where(Profile.email == "admin@aiva.local"))
                    admin_user = res.scalar_one_or_none()
                    if not admin_user:
                        salt = bcrypt.gensalt(rounds=12)
                        pwd_hash = bcrypt.hashpw("Admin@AIVA2026".encode("utf-8"), salt).decode("utf-8")
                        admin_user = Profile(
                            id=uuid4(),
                            email="admin@aiva.local",
                            full_name="System Administrator",
                            role="admin",
                            password_hash=pwd_hash,
                            is_active=True,
                        )
                        session.add(admin_user)
                        await session.commit()
                        logger.info("Default administrator account created on fallback database (admin@aiva.local).")
            except Exception as seed_err:
                logger.warning("Could not auto-seed fallback admin user: %s", seed_err)

        except Exception as fb_err:
            logger.error("Failed to initialize SQLite fallback: %s", fb_err)

    _db_initialized = True

