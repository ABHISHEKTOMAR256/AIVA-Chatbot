"""Supabase Client integration for Auth and Storage."""

from __future__ import annotations

from typing import Any, Dict, Optional
import httpx
from supabase import Client, create_client

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger("app")

_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Return a singleton Supabase client using service role key if available, else anon key."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    settings = get_settings()
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not url or not key:
        logger.warning("Supabase credentials not configured. Supabase client initialized in dummy mode.")
        # Create client with dummy URL to prevent startup crashes if not configured yet
        url = url or "https://dummy.supabase.co"
        key = key or "dummy-key"

    _supabase_client = create_client(url, key)
    return _supabase_client


async def verify_supabase_token(token: str) -> Dict[str, Any]:
    """Verify a Supabase JWT token against the Supabase GoTrue Auth API.

    Returns the user data payload or raises an Exception.
    """
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        # Development fallback when credentials are not yet populated
        import base64
        import json

        try:
            parts = token.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                payload = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
                return payload
        except Exception:
            pass
        return {"sub": "00000000-0000-0000-0000-000000000000", "email": "dev@aiva.local"}

    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
    }
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            raise ValueError(f"Supabase auth failed: {response.text}")
        return response.json()
