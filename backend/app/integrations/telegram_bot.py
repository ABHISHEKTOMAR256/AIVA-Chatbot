"""Telegram Bot integration with webhook handling and interactive conversation state."""

from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.models.complaint import Complaint
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.profile import Profile
from app.schemas.complaint import ComplaintCreate
from app.services.ai_service import AIService
from app.services.complaint_service import ComplaintService
from app.services.conversation_service import ConversationService
from app.services.handover_service import HandoverService
from app.services.rag_service import RAGService

logger = get_logger("telegram")

# In-memory transient state machine for multi-step Telegram commands:
# telegram_user_id -> {"state": "waiting_category", "data": {...}}
_user_states: Dict[int, Dict[str, Any]] = {}


class TelegramBot:
    """Handles Telegram Webhook updates and replies."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self.bot_token = self.settings.TELEGRAM_BOT_TOKEN
        self.api_base = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: Optional[str] = "Markdown",
        reply_markup: Optional[dict] = None,
    ) -> bool:
        """Send message via Telegram Bot API."""
        if not self.bot_token:
            logger.warning("Telegram Bot token not set. Message to %s suppressed: %s", chat_id, text)
            return False

        url = f"{self.api_base}/sendMessage"
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
        }
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if reply_markup:
            payload["reply_markup"] = reply_markup

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(url, json=payload)
                if res.status_code != 200:
                    logger.warning("Telegram send failed (%s: %s). Retrying plain text...", res.status_code, res.text)
                    # Fallback without Markdown if parsing error
                    if parse_mode:
                        payload.pop("parse_mode", None)
                        res = await client.post(url, json=payload)
                return res.status_code == 200
            except Exception as e:
                logger.error("Failed to send Telegram message to %s: %s", chat_id, e)
                return False

    async def get_or_create_user(self, telegram_user: dict) -> Profile:
        """Resolve or create a profile for a Telegram user."""
        tg_id = telegram_user.get("id")
        tg_username = telegram_user.get("username")
        first_name = telegram_user.get("first_name", "")
        last_name = telegram_user.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or tg_username or f"TG_{tg_id}"

        stmt = select(Profile).where(Profile.telegram_id == tg_id)
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            profile = Profile(
                email=f"tg_{tg_id}@telegram.local",
                full_name=full_name,
                first_name=first_name,
                last_name=last_name,
                telegram_id=tg_id,
                telegram_username=tg_username,
                role="user",
                is_active=True,
            )
            self.db.add(profile)
            await self.db.flush()
        else:
            if first_name and not profile.first_name:
                profile.first_name = first_name
            if last_name and not profile.last_name:
                profile.last_name = last_name
            if tg_username and profile.telegram_username != tg_username:
                profile.telegram_username = tg_username
        return profile

    async def process_update(self, update: dict) -> None:
        """Process incoming Telegram update."""
        message = update.get("message")
        if not message:
            return

        chat = message.get("chat", {})
        chat_id = chat.get("id")
        user = message.get("from", {})
        tg_user_id = user.get("id")
        text = message.get("text", "").strip()
        photo = message.get("photo")
        contact = message.get("contact")
        msg_id = message.get("message_id")

        if not chat_id or not tg_user_id:
            return

        profile = await self.get_or_create_user(user)

        # Get or create active Telegram conversation
        conv_service = ConversationService()
        conversation = await conv_service.get_or_create_conversation(
            self.db,
            user_id=profile.id,
            platform="telegram",
            platform_conversation_id=str(chat_id),
        )

        # Record incoming message in DB (with deduplication check)
        existing_msg = await self.db.execute(
            select(Message).where(Message.telegram_message_id == msg_id)
        )
        if existing_msg.scalar_one_or_none():
            logger.info("Ignoring duplicate Telegram message %s", msg_id)
            return

        # If contact was shared
        if contact:
            await self._handle_contact_message(chat_id, profile, conversation, contact, msg_id)
            return

        # Record incoming message in DB
        conv_service = ConversationService()
        if text:
            await conv_service.add_message(
                self.db,
                conversation_id=conversation.id,
                sender_type="user",
                content=text,
                message_type="text",
                telegram_message_id=msg_id,
            )

        # If photo was sent
        if photo and not text:
            await self._handle_photo_message(chat_id, profile, conversation, photo, msg_id)
            return

        # Handle commands
        if text.startswith("/"):
            await self._handle_command(chat_id, text, profile, conversation, msg_id)
            return

        # Check multi-step state machine
        if tg_user_id in _user_states:
            handled = await self._handle_state_input(chat_id, text, profile, conversation, msg_id)
            if handled:
                return

        # Natural language message -> route to AI or Human handover
        await self._handle_chat_message(chat_id, text, profile, conversation, msg_id)

    handle_update = process_update

    async def _handle_command(
        self,
        chat_id: int,
        cmd_text: str,
        profile: Profile,
        conversation: Conversation,
        msg_id: int,
    ) -> None:
        conv_service = ConversationService()
        parts = cmd_text.split(maxsplit=1)
        command = parts[0].lower()
        arg = parts[1].strip() if len(parts) > 1 else ""

        # Clear active multi-step state on command
        if command != "/cancel" and profile.telegram_id in _user_states:
            _user_states.pop(profile.telegram_id, None)

        if command in ("/start", "/help"):
            welcome = (
                "👋 *Welcome to AIVA — Hostel Helpdesk!*\n\n"
                "I am your AI assistant for hostel queries and support.\n\n"
                "*Available Commands:*\n"
                "• `/complaint` — Register a hostel issue\n"
                "• `/status [ref]` — Track your complaint status\n"
                "• `/lost` — Report lost or found items\n"
                "• `/contact` — Share your contact number for urgent alerts\n"
                "• `/human` — Connect with hostel warden/staff\n"
                "• `/link <code>` — Link this Telegram to your web account\n"
                "• `/cancel` — Cancel active action\n\n"
                "Or simply type your message and ask any question!"
            )
            await self.send_message(chat_id, welcome)
            await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=welcome)

        elif command == "/contact":
            contact_msg = (
                "📱 *Share Contact with Hostel Administration*\n\n"
                "Sharing your phone number helps the warden, maintenance staff, and medical team reach you swiftly for emergency updates or resolved complaints.\n\n"
                "• *Privacy:* Your contact is encrypted and strictly accessible by authorized staff.\n"
                "• *Optional:* You can decline anytime by typing `/cancel`.\n\n"
                "Tap the button below to share:"
            )
            markup = {
                "keyboard": [
                    [{"text": "📱 Share Contact Number", "request_contact": True}],
                    [{"text": "❌ Cancel"}],
                ],
                "resize_keyboard": True,
                "one_time_keyboard": True,
            }
            await self.send_message(chat_id, contact_msg, reply_markup=markup)
            await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=contact_msg)

        elif command == "/complaint":
            _user_states[profile.telegram_id] = {"state": "waiting_complaint_category", "data": {}}
            msg = (
                "📝 *Filing a Complaint*\n\n"
                "Please choose a category by replying with one of the numbers:\n"
                "1. Electricity\n"
                "2. Water Supply\n"
                "3. Wi-Fi\n"
                "4. Room Maintenance\n"
                "5. Cleaning\n"
                "6. Plumbing\n"
                "7. Other\n\n"
                "_Type /cancel anytime to abort._"
            )
            await self.send_message(chat_id, msg)
            await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=msg)

        elif command == "/status":
            if not arg:
                # List recent complaints
                complaints = await ComplaintService().get_user_complaints(self.db, profile.id)
                if not complaints:
                    no_comp = "ℹ️ You have no registered complaints."
                    await self.send_message(chat_id, no_comp)
                    await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=no_comp)
                else:
                    lines = ["📋 *Your Recent Complaints:*"]
                    for c in complaints[:5]:
                        lines.append(f"• `{c.reference_number}`: *{c.title}* [{c.status.upper()}]")
                    lines.append("\nCheck details with `/status <REF-NUMBER>`")
                    st_msg = "\n".join(lines)
                    await self.send_message(chat_id, st_msg)
                    await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=st_msg)
            else:
                complaint = await ComplaintService().get_complaint_by_ref(self.db, profile.id, arg.upper())
                if not complaint:
                    not_f = f"❌ Complaint reference `{arg}` not found or not owned by you."
                    await self.send_message(chat_id, not_f)
                    await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=not_f)
                else:
                    details = (
                        f"📋 *Complaint Details:*\n"
                        f"• *Ref:* `{complaint.reference_number}`\n"
                        f"• *Category:* {complaint.category.title()}\n"
                        f"• *Title:* {complaint.title}\n"
                        f"• *Status:* *{complaint.status.upper()}*\n"
                        f"• *Priority:* {complaint.priority.title()}\n"
                        f"• *Submitted:* {complaint.created_at.strftime('%Y-%m-%d %H:%M')}\n"
                    )
                    if complaint.staff_reply:
                        details += f"\n💬 *Staff Reply:* {complaint.staff_reply}"
                    await self.send_message(chat_id, details)
                    await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=details)

        elif command == "/human":
            handover_service = HandoverService()
            await handover_service.request_handover(
                self.db,
                conversation_id=conversation.id,
                user_id=profile.id,
                reason="Requested via Telegram /human command",
            )
            h_msg = "🙋‍♂️ *A human staff member has been notified.* They will review this conversation and reply shortly. Your conversation is now in human assistance mode."
            await self.send_message(chat_id, h_msg)
            await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="system", content=h_msg)

        elif command == "/cancel":
            _user_states.pop(profile.telegram_id, None)
            c_msg = "🚫 Operation cancelled. How else can I help you?"
            await self.send_message(chat_id, c_msg)
            await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=c_msg)

        elif command == "/link":
            if not arg:
                await self.send_message(chat_id, "⚠️ Please provide your verification code: `/link <CODE>`\n(Generate this code from the web portal Settings).")
                return
            stmt = select(Profile).where(
                Profile.telegram_link_code == arg.upper(),
                Profile.telegram_link_expires > datetime.now(timezone.utc),
            )
            res = await self.db.execute(stmt)
            web_profile = res.scalar_one_or_none()
            if not web_profile:
                await self.send_message(chat_id, "❌ Invalid or expired verification code.")
            else:
                web_profile.telegram_id = profile.telegram_id
                web_profile.telegram_username = profile.telegram_username
                web_profile.telegram_link_code = None
                web_profile.telegram_link_expires = None
                await self.db.commit()
                await self.send_message(chat_id, f"✅ Successfully linked Telegram to your web account (*{web_profile.email}*)!")

        elif command == "/lost":
            await self.send_message(chat_id, "🔍 To report lost items or search the catalog, please visit the AIVA Web Portal or type your item description directly!")

        else:
            await self.send_message(chat_id, "❓ Unknown command. Type `/help` for options.")

    async def _handle_state_input(
        self,
        chat_id: int,
        text: str,
        profile: Profile,
        conversation: Conversation,
        msg_id: int,
    ) -> bool:
        state_info = _user_states.get(profile.telegram_id)
        if not state_info:
            return False

        state = state_info["state"]
        data = state_info["data"]

        category_map = {
            "1": "electricity",
            "2": "water_supply",
            "3": "wifi",
            "4": "room_maintenance",
            "5": "cleaning",
            "6": "plumbing",
            "7": "other",
        }

        if state == "waiting_complaint_category":
            cat = category_map.get(text.strip()) or text.strip().lower()
            if cat not in category_map.values():
                await self.send_message(chat_id, "⚠️ Invalid option. Reply with a number from 1 to 7.")
                return True
            data["category"] = cat
            state_info["state"] = "waiting_complaint_room"
            reply = f"Category chosen: *{cat.title()}*.\n\nWhat is your *Room Number or Location*?"
            await self.send_message(chat_id, reply)
            await ConversationService().add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=reply)
            return True

        elif state == "waiting_complaint_room":
            data["room_number"] = text.strip()
            state_info["state"] = "waiting_complaint_desc"
            reply = "Please describe the issue in detail:"
            await self.send_message(chat_id, reply)
            await ConversationService().add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=reply)
            return True

        elif state == "waiting_complaint_desc":
            data["description"] = text.strip()
            data["title"] = f"{data['category'].title()} issue at Room {data.get('room_number', 'N/A')}"

            # Create complaint
            comp_in = ComplaintCreate(
                category=data["category"],
                title=data["title"],
                description=data["description"],
                room_number=data.get("room_number"),
                location=data.get("room_number"),
                priority="medium",
            )
            complaint = await ComplaintService().create_complaint(
                self.db,
                user_id=profile.id,
                data=comp_in,
                conversation_id=conversation.id,
            )
            _user_states.pop(profile.telegram_id, None)

            msg = (
                f"✅ *Complaint Registered Successfully!*\n\n"
                f"• *Reference:* `{complaint.reference_number}`\n"
                f"• *Category:* {complaint.category.title()}\n"
                f"• *Status:* Submitted\n\n"
                f"You can track this complaint anytime using:\n"
                f"`/status {complaint.reference_number}`"
            )
            await self.send_message(chat_id, msg)
            await ConversationService().add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=msg)
            return True

        return False

    async def _handle_chat_message(
        self,
        chat_id: int,
        text: str,
        profile: Profile,
        conversation: Conversation,
        msg_id: int,
    ) -> None:
        conv_service = ConversationService()

        # Check if conversation is in human mode
        if conversation.handling_mode in ("human", "pending_handover"):
            await self.send_message(
                chat_id,
                "⏳ Your message has been saved for the staff member assisting you.",
            )
            return

        # 1. Classify intent using dataset matcher
        from app.services.intent_service import IntentService

        intent_match = IntentService.get_instance().classify(text)

        # 2. Emergency or Human Handover Escalation
        if intent_match.intent in ("emergency_escalation", "human_handover") or intent_match.needs_human:
            handover_service = HandoverService()
            await handover_service.request_handover(
                self.db,
                conversation_id=conversation.id,
                user_id=profile.id,
                reason=f"Escalated [{intent_match.intent}]: {text}",
            )
            resp = intent_match.suggested_response or "Connecting you to a staff member. Your conversation history has been shared."
            await conv_service.add_message(
                self.db,
                conversation_id=conversation.id,
                sender_type="system",
                content=resp,
            )
            await self.send_message(chat_id, resp)
            return

        # 3. Direct Complaint Filing if category, block and room are mentioned
        if intent_match.intent == "hostel_complaint" and intent_match.entities.get("block") and intent_match.entities.get("room"):
            comp_service = ComplaintService()
            raw_cat = (intent_match.entities.get("category") or "other").lower()
            cat_map = {
                "water": "water_supply",
                "water_supply": "water_supply",
                "electricity": "electricity",
                "wifi": "wifi",
                "wi-fi": "wifi",
                "cleaning": "cleaning",
                "plumbing": "plumbing",
                "pest": "room_maintenance",
                "furniture": "room_maintenance",
                "noise": "other",
            }
            cat = cat_map.get(raw_cat, "other")
            block = intent_match.entities.get("block")
            room = intent_match.entities.get("room")
            complaint = await comp_service.create_complaint(
                self.db,
                user_id=profile.id,
                data=ComplaintCreate(
                    category=cat,
                    title=f"{cat.replace('_', ' ').title()} complaint in {block} room {room}",
                    description=text,
                    location=block,
                    room_number=room,
                    priority="high" if any(w in text.lower() for w in ["spark", "urgent", "broken", "asap"]) else "medium",
                ),
                conversation_id=conversation.id,
            )
            msg = (
                f"✅ *Complaint Registered Successfully!*\n\n"
                f"• *Ticket ID:* `{complaint.reference_number}`\n"
                f"• *Category:* {cat.replace('_', ' ').title()}\n"
                f"• *Location:* {block}, Room {room}\n"
                f"• *Status:* Submitted (Expected resolution: 24-48 hrs)\n\n"
                f"You can track this complaint anytime using:\n"
                f"`/status {complaint.reference_number}`"
            )
            await conv_service.add_message(
                self.db,
                conversation_id=conversation.id,
                sender_type="ai",
                content=msg,
            )
            await self.send_message(chat_id, msg)
            return

        # 4. Call AI service with RAG knowledge base + matched dataset intent
        ai_service = AIService()
        history = await conv_service.get_context_messages(self.db, conversation.id, limit=6)
        rag = RAGService(self.db)
        context_docs = await rag.search_relevant_docs(text, top_k=3)
        if intent_match.suggested_response:
            context_docs.append(f"Standard guidance: {intent_match.suggested_response}")

        system_prompt = ai_service.build_system_prompt(profile, context_docs=context_docs)

        response_text, elapsed_ms = await ai_service.generate_response(
            conversation_history=history,
            user_message=text,
            system_prompt=system_prompt,
        )

        # Save AI reply
        await conv_service.add_message(
            self.db,
            conversation_id=conversation.id,
            sender_type="ai",
            content=response_text,
            ai_model=self.settings.OLLAMA_MODEL,
            response_time_ms=elapsed_ms,
        )

        await self.send_message(chat_id, response_text)

    async def _handle_photo_message(
        self,
        chat_id: int,
        profile: Profile,
        conversation: Conversation,
        photo_list: list,
        msg_id: int,
    ) -> None:
        # Save placeholder for attachment
        conv_service = ConversationService()
        await conv_service.add_message(
            self.db,
            conversation_id=conversation.id,
            sender_type="user",
            content="[Sent photo]",
            message_type="image",
            telegram_message_id=msg_id,
        )
        await self.send_message(
            chat_id,
            "📷 Photo received and attached to your conversation records. If this relates to an issue, please file a complaint using `/complaint`.",
        )

    async def _handle_contact_message(
        self,
        chat_id: int,
        profile: Profile,
        conversation: Conversation,
        contact: dict,
        msg_id: int,
    ) -> None:
        """Handle contact card shared via Telegram request_contact button."""
        conv_service = ConversationService()
        tg_user_id = profile.telegram_id
        contact_user_id = contact.get("user_id")

        # Security check: Ensure the contact card matches the sender's account
        if contact_user_id and contact_user_id != tg_user_id:
            reply = "⚠️ The shared contact does not match your Telegram account. Please share your own contact."
            await self.send_message(chat_id, reply, reply_markup={"remove_keyboard": True})
            return

        raw_phone = str(contact.get("phone_number", "")).strip()
        if not raw_phone:
            return

        # Normalize phone number with country code
        phone = raw_phone if raw_phone.startswith("+") else f"+{raw_phone}"

        profile.phone_number = phone
        profile.phone_shared_at = datetime.now(timezone.utc)
        if contact.get("first_name"):
            profile.first_name = contact.get("first_name")
        if contact.get("last_name"):
            profile.last_name = contact.get("last_name")

        # Record contact message in conversation
        await conv_service.add_message(
            self.db,
            conversation_id=conversation.id,
            sender_type="user",
            content=f"📱 Shared contact number: {phone}",
            message_type="contact",
            telegram_message_id=msg_id,
        )

        success_msg = (
            "✅ *Contact Verified & Linked Successfully!*\n\n"
            f"Your phone number (`{phone}`) has been safely recorded on your student profile. "
            "Hostel administration and maintenance staff will use this for urgent notifications and visit coordination."
        )
        await self.send_message(chat_id, success_msg, reply_markup={"remove_keyboard": True})
        await conv_service.add_message(self.db, conversation_id=conversation.id, sender_type="ai", content=success_msg)


async def _process_single_update(update: dict) -> None:
    """Process one update with an isolated DB session so errors don't stop the loop."""
    from app.core.database import async_session_factory
    try:
        async with async_session_factory() as db:
            bot = TelegramBot(db)
            await bot.process_update(update)
            await db.commit()
    except Exception as e:
        logger.error("Error processing update %s: %s", update.get("update_id"), e, exc_info=True)


async def run_polling() -> None:
    """Run bot in long-polling mode for local development.

    Allows testing the bot directly without requiring an SSL webhook tunnel.
    """
    import asyncio

    settings = get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    if not token or token.startswith("dummy"):
        logger.error("No valid TELEGRAM_BOT_TOKEN found in environment.")
        return

    logger.info("Initializing Telegram Polling for @AIVA_LPU_bot...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            await client.post(f"https://api.telegram.org/bot{token}/deleteWebhook")
        except Exception as e:
            logger.warning("Could not delete webhook: %s", e)

    offset = 0
    print("==================================================")
    print(" AIVA Telegram Bot is ONLINE! (@AIVA_LPU_bot)")
    print(" Listening for messages... Send /start in Telegram!")
    print("==================================================")

    async with httpx.AsyncClient(timeout=35.0) as client:
        while True:
            try:
                resp = await client.get(
                    f"https://api.telegram.org/bot{token}/getUpdates",
                    params={"offset": offset, "timeout": 20},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for update in data.get("result", []):
                        offset = update["update_id"] + 1
                        asyncio.create_task(_process_single_update(update))
                elif resp.status_code == 409:
                    logger.warning("Conflict with webhook or another bot instance: %s. Retrying in 3s...", resp.text)
                    await asyncio.sleep(3)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Polling error: %s", e)
                await asyncio.sleep(2)


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_polling())
