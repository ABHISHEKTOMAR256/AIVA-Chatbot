"""Authentication and role authorization tests."""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_health_check_unauthenticated():
    """Verify health endpoint is publicly accessible without token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_protected_route_without_token():
    """Verify protected user route rejects requests missing bearer token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/auth/me")
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_user_me(client, regular_profile):
    """Verify authenticated user can fetch their profile."""
    res = await client.get("/api/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "student@university.edu"
    assert data["role"] == "user"


@pytest.mark.asyncio
async def test_regular_user_forbidden_from_admin(client):
    """Verify regular user cannot access admin dashboard."""
    res = await client.get("/api/admin/dashboard")
    assert res.status_code == 403
