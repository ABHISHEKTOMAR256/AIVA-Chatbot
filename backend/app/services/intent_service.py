"""Intent Classification and Entity Extraction Service backed by the Campus Dataset."""

from __future__ import annotations

import csv
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.logging_config import get_logger

logger = get_logger("ai")


@dataclass
class IntentMatch:
    intent: str
    confidence: float
    entities: Dict[str, str] = field(default_factory=dict)
    needs_human: bool = False
    language: str = "english"
    suggested_response: Optional[str] = None
    matched_example: Optional[str] = None


class IntentService:
    """Classifies user queries and extracts entities using the 887-row campus dataset."""

    _instance: Optional[IntentService] = None

    def __init__(self, dataset_path: Optional[str] = None) -> None:
        if dataset_path is None:
            # Default path relative to backend root
            base_dir = Path(__file__).resolve().parent.parent.parent
            dataset_path = str(base_dir / "data" / "campus_dataset.csv")

        self.dataset_path = dataset_path
        self.rows: List[Dict[str, str]] = []
        self.messages: List[str] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None

        self._load_and_train()

    @classmethod
    def get_instance(cls) -> IntentService:
        if cls._instance is None:
            cls._instance = IntentService()
        return cls._instance

    def _load_and_train(self) -> None:
        if not os.path.exists(self.dataset_path):
            logger.warning(f"Dataset not found at {self.dataset_path}; running in rule-only mode.")
            return

        try:
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    msg = r.get("user_message", "").strip()
                    if msg:
                        self.messages.append(msg)
                        self.rows.append(r)

            if self.messages:
                self.vectorizer = TfidfVectorizer(
                    ngram_range=(1, 2),
                    min_df=1,
                    sublinear_tf=True,
                )
                self.tfidf_matrix = self.vectorizer.fit_transform(self.messages)
                logger.info(
                    f"IntentService initialized with {len(self.messages)} examples from campus dataset."
                )
        except Exception as e:
            logger.exception(f"Failed to load campus dataset: {e}")

    def classify(self, query: str) -> IntentMatch:
        """Classify a user message into intent, entities, and human flag."""
        cleaned_query = query.strip()
        if not cleaned_query:
            return IntentMatch(intent="fallback", confidence=0.0)

        # 1. Direct Regex / Pattern Overrides for Critical Intents
        lower_q = cleaned_query.lower()

        # Emergency keywords
        if any(w in lower_q for w in ["fire", "ragging", "harassed", "emergency", "fainted", "hurt in the ground"]):
            return IntentMatch(
                intent="emergency_escalation",
                confidence=1.0,
                needs_human=True,
                suggested_response=(
                    "⚠️ This looks urgent. Escalating to security and medical team now. "
                    "Campus emergency: please also call the campus helpline immediately."
                ),
            )

        # Human handover keywords
        if any(w in lower_q for w in ["insaan se", "talk to human", "speak to staff", "connect me to warden", "agent please", "escalate this"]):
            return IntentMatch(
                intent="human_handover",
                confidence=1.0,
                needs_human=True,
                suggested_response="Connecting you to a staff member. Your conversation history has been shared. Expected wait: a few minutes.",
            )

        # 2. Dataset TF-IDF Similarity Match
        best_row = None
        best_score = 0.0

        if self.vectorizer is not None and self.tfidf_matrix is not None:
            try:
                q_vec = self.vectorizer.transform([cleaned_query])
                sims = cosine_similarity(q_vec, self.tfidf_matrix)[0]
                best_idx = int(sims.argmax())
                best_score = float(sims[best_idx])
                if best_score > 0.15:  # meaningful match
                    best_row = self.rows[best_idx]
            except Exception as e:
                logger.warning(f"TF-IDF matching error: {e}")

        # 3. Dynamic Entity Extraction from user query
        extracted_entities = self._extract_entities(cleaned_query)

        if best_row and best_score >= 0.35:
            # Parse entities from dataset row if not extracted from query
            row_entities = self._parse_entity_string(best_row.get("entities", ""))
            # Merge: extracted from query takes precedence
            final_entities = {**row_entities, **extracted_entities}

            needs_human = best_row.get("needs_human", "0").strip() == "1"
            if best_row["intent"] in ("emergency_escalation", "human_handover"):
                needs_human = True

            return IntentMatch(
                intent=best_row["intent"],
                confidence=round(best_score, 2),
                entities=final_entities,
                needs_human=needs_human,
                language=best_row.get("language", "english"),
                suggested_response=best_row.get("bot_response"),
                matched_example=best_row.get("user_message"),
            )

        # Fallback to general categorization
        return IntentMatch(
            intent="general_inquiry",
            confidence=round(best_score, 2),
            entities=extracted_entities,
            needs_human=False,
            language="hinglish" if self._is_hinglish(cleaned_query) else "english",
        )

    @staticmethod
    def _parse_entity_string(entity_str: str) -> Dict[str, str]:
        """Convert 'category=water;block=Girls Hostel 2;room=208' to dict."""
        res: Dict[str, str] = {}
        if not entity_str:
            return res
        pairs = entity_str.split(";")
        for p in pairs:
            if "=" in p:
                k, v = p.split("=", 1)
                res[k.strip()] = v.strip()
        return res

    @staticmethod
    def _extract_entities(text: str) -> Dict[str, str]:
        """Extract room, block, category, item from natural text."""
        entities: Dict[str, str] = {}

        # Room number (e.g., room 302, room 424, 208)
        room_match = re.search(r'\b(?:room|rm)\s*#?\s*([A-Za-z0-9\-]+)\b', text, re.IGNORECASE)
        if room_match:
            entities["room"] = room_match.group(1)
        else:
            # Look for 3 or 4 digit numbers
            digit_match = re.search(r'\b([1-9][0-9]{2,3})\b', text)
            if digit_match:
                entities["room"] = digit_match.group(1)

        # Block / Hostel
        block_match = re.search(
            r'\b((?:Girls\s+Hostel|Boys\s+Hostel|Block|Mega\s+Hostel)\s+\d+)\b',
            text,
            re.IGNORECASE,
        )
        if block_match:
            entities["block"] = block_match.group(1).title()

        # Complaint Category
        lower = text.lower()
        if any(w in lower for w in ["water", "tap", "leak", "hot water", "cooler", "plumbing"]):
            entities["category"] = "water_supply"
        elif any(w in lower for w in ["electricity", "light", "spark", "switch", "fan", "ac", "power cut"]):
            entities["category"] = "electricity"
        elif any(w in lower for w in ["wifi", "wi-fi", "internet", "signal", "network"]):
            entities["category"] = "wifi"
        elif any(w in lower for w in ["cleaning", "dustbin", "sweep", "dirty", "washroom"]):
            entities["category"] = "cleaning"
        elif any(w in lower for w in ["pest", "rat", "mosquito", "cockroach"]):
            entities["category"] = "pest"
        elif any(w in lower for w in ["noise", "loud", "shout", "music"]):
            entities["category"] = "noise"
        elif any(w in lower for w in ["chair", "bed", "window", "cupboard", "lock", "furniture"]):
            entities["category"] = "furniture"
        elif any(w in lower for w in ["mess", "food", "stale", "dinner", "lunch"]):
            entities["category"] = "mess"

        return entities

    @staticmethod
    def _is_hinglish(text: str) -> bool:
        hinglish_words = [
            "kya", "hota", "hai", "bhai", "mera", "meri", "kho", "gaya", "mila",
            "kab", "khulta", "insaan", "baat", "karao", "paas", "nahi", "karo", "pls"
        ]
        lower = text.lower()
        return any(f" {w} " in f" {lower} " for w in hinglish_words)
