"""Telegram Webhook route with secret verification and background dispatch."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session_factory, get_db
from app.core.logging_config import get_logger
from app.core.security import get_current_admin, verify_telegram_webhook_secret
from app.integrations.telegram_bot import TelegramBot
from app.schemas.auth import UserInfo

logger = get_logger("telegram")
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _process_telegram_update_task(update: dict) -> None:
    """Background task: execute update processing with dedicated DB session."""
    async with async_session_factory() as session:
        try:
            bot = TelegramBot(session)
            await bot.process_update(update)
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("Error processing Telegram update in background: %s", e, exc_info=True)


@router.post("/telegram")
async def handle_telegram_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    _: None = Depends(verify_telegram_webhook_secret),
) -> dict:
    """Receive Telegram webhook update, acknowledge immediately, and process asynchronously."""
    try:
        update = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    background_tasks.add_task(_process_telegram_update_task, update)
    return {"status": "ok"}


@router.post("/telegram/setup")
async def setup_telegram_webhook(
    admin: UserInfo = Depends(get_current_admin),
) -> dict:
    """Register the Telegram bot webhook with Telegram API."""
    settings = get_settings()
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_WEBHOOK_URL:
        raise HTTPException(
            status_code=400,
            detail="TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_URL must be configured in environment.",
        )

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/setWebhook"
    payload = {
        "url": settings.TELEGRAM_WEBHOOK_URL,
        "secret_token": settings.TELEGRAM_WEBHOOK_SECRET,
        "allowed_updates": ["message", "callback_query"],
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, json=payload)
        return res.json()
