"""Application configuration via environment variables."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILES = () if os.environ.get("TESTING") == "1" else (str(Path(__file__).resolve().parent.parent.parent / ".env"), ".env")


class Settings(BaseSettings):
    """Central settings populated from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Supabase ───────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Database ───────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/aiva"

    # ── Ollama / LLM ──────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_TIMEOUT: int = 120
    OLLAMA_MAX_TOKENS: int = 2048

    # ── Cloud LLM (Optional free cloud inference via Groq) ─────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ── Telegram ──────────────────────────────────────────────
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_SECRET: str = ""
    TELEGRAM_WEBHOOK_URL: str = ""

    # ── Security & Authentication ────────────────────────────
    APP_SECRET_KEY: str = "change-me-in-production"
    FIREBASE_PROJECT_ID: str = "aiva-chatbot-55b17"
    ADMIN_EMAILS: str = "admin@aiva.local,abhishektomar256@gmail.com,admin@university.edu"

    @property
    def admin_emails_set(self) -> set[str]:
        """Set of allowed administrator emails for server-side role verification."""
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}

    # ── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # ── Server ────────────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # ── Logging ───────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"

    # ── Uploads ───────────────────────────────────────────────
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB


@lru_cache()
def get_settings() -> Settings:
    """Singleton settings instance."""
    return Settings()
