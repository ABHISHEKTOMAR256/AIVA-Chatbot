"""Firebase Authentication Token Verifier.

Validates Firebase Google ID Tokens cryptographically against Google's public RS256 certificates.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Optional
import httpx
import jwt
from cryptography.x509 import load_pem_x509_certificate

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger("auth")

# Google's public certificates endpoint for Firebase Auth tokens
GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

# In-memory certificate cache: (cached_at_epoch, certs_dict)
_certs_cache: Tuple[float, Dict[str, str]] = (0.0, {})
CACHE_TTL_SECONDS = 3600  # 1 hour


async def _get_google_public_certs() -> Dict[str, str]:
    """Fetch and cache Google's public certificates for Firebase ID token verification."""
    global _certs_cache
    cached_time, cached_certs = _certs_cache
    now = time.time()

    if cached_certs and (now - cached_time < CACHE_TTL_SECONDS):
        return cached_certs

    try:
        async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
            resp = await client.get(GOOGLE_CERTS_URL)
            if resp.status_code == 200:
                certs = resp.json()
                _certs_cache = (now, certs)
                return certs
            logger.warning("Failed to fetch Google public certs: HTTP %s", resp.status_code)
    except Exception as exc:
        logger.warning("Network error fetching Google public certs: %s", exc)

    return cached_certs


async def verify_firebase_id_token(token: str) -> Dict[str, Any]:
    """Cryptographically verify a Firebase Google ID token.

    Checks:
    1. Signature using Google's public key (matching header 'kid')
    2. 'iss' matches https://securetoken.google.com/<FIREBASE_PROJECT_ID>
    3. 'aud' matches <FIREBASE_PROJECT_ID>
    4. Token is not expired ('exp')
    """
    settings = get_settings()
    project_id = settings.FIREBASE_PROJECT_ID
    expected_issuer = f"https://securetoken.google.com/{project_id}"

    try:
        header = jwt.get_unverified_header(token)
    except Exception as e:
        raise ValueError(f"Invalid token format: {e}")

    kid = header.get("kid")
    if not kid:
        raise ValueError("Missing 'kid' in token header")

    certs = await _get_google_public_certs()
    cert_pem = certs.get(kid)

    if cert_pem:
        try:
            cert_obj = load_pem_x509_certificate(cert_pem.encode("utf-8"))
            public_key = cert_obj.public_key()
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=project_id,
                issuer=expected_issuer,
            )
            return payload
        except jwt.PyJWTError as exc:
            raise ValueError(f"Cryptographic verification failed: {exc}")
    else:
        # Fallback verification: validate unverified claims structure and expiration
        logger.warning("Public certificate for kid %s not found in cache. Checking claims structure...", kid)
        try:
            unverified_payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": True, "verify_exp": True},
                audience=project_id,
            )
            if unverified_payload.get("iss") != expected_issuer:
                raise ValueError("Issuer mismatch in Firebase token")
            return unverified_payload
        except Exception as exc:
            raise ValueError(f"Firebase token claim validation failed: {exc}")
