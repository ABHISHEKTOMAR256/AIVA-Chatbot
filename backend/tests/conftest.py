"""Test fixtures and mock dependencies for automated testing."""

from __future__ import annotations

import os

# Set test environment variables BEFORE importing app modules
os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "mock-anon-key"
os.environ["APP_SECRET_KEY"] = "test-secret-key-12345678901234567890"
os.environ["TELEGRAM_BOT_TOKEN"] = "123456:mock-bot-token"

import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import get_db, engine
from app.core.security import get_current_admin, get_current_user
from app.main import app
from app.models.base import Base
from app.models.profile import Profile
from app.schemas.auth import UserInfo

# In-memory SQLite for fast, isolated automated tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionFactory = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest_asyncio.fixture(autouse=True)
async def prepare_database():
    """Create all tables before each test and drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide isolated async DB session."""
    async with TestSessionFactory() as session:
        yield session


# Mock users
TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_ADMIN_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")

mock_regular_user = UserInfo(
    id=TEST_USER_ID,
    email="student@university.edu",
    full_name="Student Tester",
    role="user",
)

mock_admin_user = UserInfo(
    id=TEST_ADMIN_ID,
    email="admin@university.edu",
    full_name="Hostel Warden Admin",
    role="admin",
)


@pytest_asyncio.fixture
async def regular_profile(db_session: AsyncSession) -> Profile:
    p = Profile(
        id=TEST_USER_ID,
        email="student@university.edu",
        full_name="Student Tester",
        role="user",
        is_active=True,
    )
    db_session.add(p)
    await db_session.commit()
    await db_session.refresh(p)
    return p


@pytest_asyncio.fixture
async def admin_profile(db_session: AsyncSession) -> Profile:
    p = Profile(
        id=TEST_ADMIN_ID,
        email="admin@university.edu",
        full_name="Hostel Warden Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(p)
    await db_session.commit()
    await db_session.refresh(p)
    return p


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test client with normal user authentication overridden."""
    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return mock_regular_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test client with admin authentication overridden."""
    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return mock_admin_user

    async def override_get_current_admin():
        return mock_admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_admin] = override_get_current_admin

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
