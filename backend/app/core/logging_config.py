"""Structured JSON logging configuration."""

from __future__ import annotations

import logging
import json
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Optional

from app.core.config import get_settings

# Context variable that holds the current request ID
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class JSONFormatter(logging.Formatter):
    """Emit each log record as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        req_id = request_id_ctx.get()
        if req_id:
            log_entry["request_id"] = req_id
        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry, default=str)


def setup_logging() -> None:
    """Configure structured logging for the entire application."""
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    # Root logger
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    # Named loggers
    for name in ("app", "database", "ai", "telegram"):
        logger = logging.getLogger(name)
        logger.setLevel(level)
        logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    """Return a named logger."""
    return logging.getLogger(name)
