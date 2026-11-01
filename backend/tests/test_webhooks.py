"""Telegram webhook verification, duplicate delivery protection, and update handling tests."""

import pytest
from httpx import AsyncClient, ASGITransport

from app.core.config import get_settings
from app.main import app


@pytest.mark.asyncio
async def test_webhook_secret_verification_failure():
    """Verify invalid telegram secret token returns 403."""
    settings = get_settings()
    settings.TELEGRAM_WEBHOOK_SECRET = "super_secret_token_123"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/webhooks/telegram",
            headers={"X-Telegram-Bot-Api-Secret-Token": "wrong_token"},
            json={"update_id": 1001, "message": {"text": "hello"}},
        )
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_webhook_valid_secret_accepted():
    """Verify valid telegram secret token returns 200 immediately."""
    settings = get_settings()
    settings.TELEGRAM_WEBHOOK_SECRET = "valid_secret_456"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/webhooks/telegram",
            headers={"X-Telegram-Bot-Api-Secret-Token": "valid_secret_456"},
            json={"update_id": 1002, "message": {"text": "/help", "chat": {"id": 99999}, "from": {"id": 99999}}},
        )
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}
