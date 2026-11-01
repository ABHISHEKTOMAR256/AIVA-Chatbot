"""AIVA — Artificial Intelligence Virtual Assistant
Main FastAPI Application Entry Point.
"""

from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

from app.api.routes import admin, auth, chat, complaints, lost_found, media, webhooks
from app.core.config import get_settings
from app.core.database import init_db
from app.core.logging_config import get_logger, setup_logging

setup_logging()
logger = get_logger("app")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize resources on startup, clean up on shutdown."""
    import os
    if os.environ.get("TESTING") == "1":
        yield
        return

    logger.info("Starting AIVA Helpdesk API backend...")

    # 1. Attempt DB connection check with quick timeout
    try:
        import asyncio
        await asyncio.wait_for(init_db(), timeout=1.5)
        logger.info("Database connection verified.")
    except Exception as exc:
        logger.warning("Database connection check failed or timed out: %s", exc)

    # 2. Check Ollama availability with quick timeout
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
            if resp.status_code == 200:
                models = [m.get("name") for m in resp.json().get("models", [])]
                logger.info("Ollama is reachable. Installed models: %s", models)
            else:
                logger.warning("Ollama responded with status %s", resp.status_code)
    except Exception:
        logger.info("Ollama is not running locally. Model fallback mode will be active.")

    yield

    logger.info("Shutting down AIVA backend.")


app = FastAPI(
    title="AIVA — Artificial Intelligence Virtual Assistant API",
    description="Hostel Helpdesk AI Backend with Ollama, PostgreSQL, and Telegram",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request ID & Timing Middleware ─────────────────────────────────────────────
@app.middleware("http")
async def add_request_id_and_timing(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start_time = time.perf_counter()

    response: Response = await call_next(request)

    process_time = (time.perf_counter() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    return response


# ── Global Safe Exception Handler ──────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "request_id": request.headers.get("X-Request-ID", "unknown"),
        },
    )


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint for container monitors and uptime checkers."""
    return {
        "status": "healthy",
        "service": "AIVA Helpdesk API",
        "version": "1.0.0",
    }


# ── Include Routers ────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(lost_found.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(webhooks.router)  # includes /webhooks/telegram
