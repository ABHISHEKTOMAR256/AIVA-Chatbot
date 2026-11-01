"""AI / LLM service — Ollama integration for chat completions."""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import Settings, get_settings
from app.core.logging_config import get_logger

logger = get_logger("ai")

# ── Detailed system prompt ────────────────────────────────────
_BASE_SYSTEM_PROMPT = """\
You are AIVA (Artificial Intelligence Virtual Assistant), the hostel helpdesk assistant.
You help students with:
- Registering and tracking complaints (electricity, water, Wi-Fi, maintenance, cleaning, plumbing)
- Lost and found items
- Hostel rules and FAQs
- General hostel queries

IMPORTANT RULES:
- Never invent hostel policies, rules, or contact details.
- Never promise specific resolution times.
- Never fabricate complaint statuses — always check the database.
- If you don't know something, say so honestly and offer to connect the student with staff.
- Ask for missing details when registering complaints (room number, specific issue).
- Suggest human assistance for complex or sensitive issues.
- Be friendly, helpful, and concise.
- When a student wants to file a complaint, gather: category (electricity/water_supply/wifi/room_maintenance/cleaning/plumbing/other), title, description, room number, and location.
- When a student asks about complaint status, ask for the reference number (format AIVA-YYYYMMDD-XXXX).
- For lost/found items, gather: item type (lost/found), title, description, location, date, and category.
- Always respond in a warm, professional tone.
"""


class AIService:
    """Thin wrapper around the Ollama ``/api/chat`` endpoint."""

    def __init__(
        self,
        http_client: Optional[httpx.AsyncClient] = None,
        settings: Optional[Settings] = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._client = http_client

    # ── Internal helpers ──────────────────────────────────────

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.settings.OLLAMA_TIMEOUT)
        return self._client

    # ── Public API ────────────────────────────────────────────

    async def check_ollama_available(self) -> tuple[bool, List[str]]:
        """Return (is_available, [model_names])."""
        try:
            client = await self._get_client()
            resp = await client.get(f"{self.settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m["name"] for m in data.get("models", [])]
                return True, models
            return False, []
        except Exception as exc:
            logger.warning("Ollama availability check failed: %s", exc)
            return False, []

    async def get_available_models(self) -> List[str]:
        """List installed Ollama models."""
        available, models = await self.check_ollama_available()
        return models if available else []

    async def generate_response(
        self,
        conversation_history: List[Dict[str, str]],
        user_message: str,
        system_prompt: str,
    ) -> tuple[str, int]:
        """Send the conversation to Ollama and return (response_text, elapsed_ms).

        Falls back to a polite error string when Ollama is unreachable.
        """
        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        payload: Dict[str, Any] = {
            "model": self.settings.OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {
                "num_predict": self.settings.OLLAMA_MAX_TOKENS,
            },
        }

        start = time.perf_counter()

        # 1. Try Groq Cloud LLM if API key is provided (blazing fast, 100% free tier)
        if self.settings.GROQ_API_KEY:
            try:
                client = await self._get_client()
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.settings.GROQ_API_KEY}"},
                    json={
                        "model": self.settings.GROQ_MODEL,
                        "messages": messages,
                        "temperature": 0.5,
                        "max_tokens": 1024,
                    },
                    timeout=25.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    elapsed_ms = int((time.perf_counter() - start) * 1000)
                    return content, elapsed_ms
                logger.warning("Groq returned status %d: %s", resp.status_code, resp.text[:200])
            except Exception as e:
                logger.warning("Groq request failed, trying fallback: %s", e)

        # 2. Try Local Ollama
        try:
            client = await self._get_client()
            resp = await client.post(
                f"{self.settings.OLLAMA_BASE_URL}/api/chat",
                json=payload,
                timeout=self.settings.OLLAMA_TIMEOUT,
            )
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            if resp.status_code != 200:
                logger.error("Ollama returned status %d: %s", resp.status_code, resp.text[:500])
                from app.services.intent_service import IntentService
                match = IntentService.get_instance().classify(user_message)
                if match.suggested_response:
                    return match.suggested_response, elapsed_ms
                return (
                    "I'm sorry, I'm having trouble processing your request right now. "
                    "Please try again in a moment or type /human to speak with staff.",
                    elapsed_ms,
                )

            data = resp.json()
            content = data.get("message", {}).get("content", "").strip()
            if not content:
                content = "I'm sorry, I couldn't generate a response. Please try again."
            return content, elapsed_ms

        except httpx.TimeoutException:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.warning("Ollama request timed out after %d ms", elapsed_ms)
            from app.services.intent_service import IntentService
            match = IntentService.get_instance().classify(user_message)
            if match.suggested_response:
                return match.suggested_response, elapsed_ms
            return (
                "I'm sorry, the request took too long. Please try a shorter question "
                "or type /human to speak with staff.",
                elapsed_ms,
            )
        except httpx.ConnectError:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.info("Local Ollama not reachable; using dataset matcher fallback.")
            from app.services.intent_service import IntentService
            match = IntentService.get_instance().classify(user_message)
            if match.suggested_response:
                return match.suggested_response, elapsed_ms
            return (
                "Hello! I am AIVA, your hostel assistant. I can help you register complaints, "
                "track issue status, search lost & found items, and provide campus info. "
                "Type /help for options or /human to connect with staff.",
                elapsed_ms,
            )
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.exception("Unexpected error in AI service: %s", exc)
            return (
                "An unexpected error occurred. Please try again or type /human for help.",
                elapsed_ms,
            )

    def build_system_prompt(
        self,
        user_profile: Optional[dict] = None,
        context_docs: Optional[List[str]] = None,
    ) -> str:
        """Construct the full system prompt, optionally enriched with RAG context."""
        parts = [_BASE_SYSTEM_PROMPT]

        if user_profile:
            if isinstance(user_profile, dict):
                name = user_profile.get("full_name") or user_profile.get("email", "Student")
            else:
                name = getattr(user_profile, "full_name", None) or getattr(user_profile, "email", "Student")
            parts.append(f"\nThe student's name is {name}.")

        if context_docs:
            parts.append(
                "\n--- HOSTEL KNOWLEDGE BASE (use this to answer questions) ---\n"
            )
            for doc in context_docs:
                parts.append(doc)
            parts.append("\n--- END OF KNOWLEDGE BASE ---")
            parts.append(
                "\nUse the knowledge base above to answer questions about hostel rules, "
                "policies, and FAQs. If the answer is not in the knowledge base, say so "
                "rather than guessing."
            )

        return "\n".join(parts)

    async def analyze_intent(self, message: str) -> Dict[str, Any]:
        """Classify intent and extract entities using the campus dataset matcher."""
        from app.services.intent_service import IntentService

        match = IntentService.get_instance().classify(message)
        return {
            "intent": match.intent,
            "confidence": match.confidence,
            "entities": match.entities,
            "needs_human": match.needs_human,
            "language": match.language,
            "suggested_response": match.suggested_response,
        }
