"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bot,
  Send,
  User,
  Shield,
  Clock,
  Radio,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import {
  getLiveConversations,
  getLiveConversationDetail,
  sendManualReply,
  updateConversationMode,
} from "@/lib/api";
import type { AdminConversationItem, AdminConversationDetail } from "@/types";

export default function ChatbotControlPage() {
  const { isAdmin, isGuest, requireAuth } = useGuestAuth();

  const [conversations, setConversations] = useState<AdminConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<AdminConversationDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [modeLoading, setModeLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load active conversations
  const loadConversations = async () => {
    try {
      if (isAdmin) {
        const res = await getLiveConversations({ page_size: 20 });
        setConversations(res.conversations || []);
        if (res.conversations?.length > 0 && !selectedConvId) {
          setSelectedConvId(String(res.conversations[0].id));
        }
      } else {
        // Guest demonstration data
        const demoList: any[] = [
          {
            id: "demo-control-1",
            user_name: "Aman Sharma (Demo)",
            telegram_username: "aman_s",
            platform: "telegram",
            status: "active",
            handling_mode: "ai",
            message_count: 5,
            last_message_text: "Where can I report Wi-Fi router issues?",
            created_at: new Date().toISOString(),
          },
          {
            id: "demo-control-2",
            user_name: "Priya Patel (Demo)",
            telegram_username: "priya_p",
            platform: "telegram",
            status: "active",
            handling_mode: "human",
            message_count: 8,
            last_message_text: "Water leakage in Room 304, Block C.",
            created_at: new Date().toISOString(),
          },
        ];
        setConversations(demoList);
        if (!selectedConvId) {
          setSelectedConvId("demo-control-1");
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [isAdmin]);

  // Load single conversation details
  useEffect(() => {
    if (!selectedConvId) return;

    if (isAdmin) {
      getLiveConversationDetail(selectedConvId)
        .then((detail) => {
          setConvDetail(detail);
        })
        .catch(() => {});
    } else {
      // Guest demo thread
      setConvDetail({
        conversation: {
          id: selectedConvId as any,
          user_id: "demo-user" as any,
          user_name: "Aman Sharma (Demo)",
          telegram_username: "aman_s",
          platform: "telegram",
          status: "active",
          handling_mode: selectedConvId === "demo-control-2" ? "human" : "ai",
          message_count: 4,
          created_at: new Date().toISOString() as any,
        },
        messages: [
          {
            id: "1",
            sender_type: "user",
            content: "Hello AIVA, how do I file a room maintenance complaint?",
            message_type: "text",
            created_at: "10:14 AM",
          },
          {
            id: "2",
            sender_type: "ai",
            content: "👋 You can file a complaint anytime using `/complaint` or by telling me the issue and your room number!",
            message_type: "text",
            created_at: "10:14 AM",
          },
          {
            id: "3",
            sender_type: "user",
            content: "Where can I report Wi-Fi router issues?",
            message_type: "text",
            created_at: "10:15 AM",
          },
        ],
        user_profile: {
          id: "demo-user" as any,
          full_name: "Aman Sharma (Demo)",
          telegram_username: "aman_s",
          email: "aman@telegram.local",
          phone_number: "+91 98765 43210 (Guest hidden)",
          first_interaction: new Date() as any,
          status: "active",
          total_conversations: 2,
          total_messages_sent: 5,
        },
      });
    }
  }, [selectedConvId, isAdmin]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convDetail?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    if (!requireAuth("Send manual Telegram reply directly to student")) {
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const res = await sendManualReply(selectedConvId, replyText.trim());
      setSendSuccess("Message dispatched to student on Telegram successfully!");
      setReplyText("");

      // Reload detail
      const updated = await getLiveConversationDetail(selectedConvId);
      setConvDetail(updated);
    } catch (err: any) {
      setSendError(err.message || "Failed to dispatch message to Telegram.");
    } finally {
      setIsSending(false);
    }
  };

  const handleModeSwitch = async (newMode: "ai" | "human") => {
    if (!selectedConvId) return;
    if (!requireAuth(`Switch conversation handling mode to ${newMode.toUpperCase()}`)) {
      return;
    }

    setModeLoading(true);
    try {
      await updateConversationMode(selectedConvId, newMode);
      const updated = await getLiveConversationDetail(selectedConvId);
      setConvDetail(updated);
    } catch (err: any) {
      alert("Mode switch error: " + err.message);
    } finally {
      setModeLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Control Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[32px] glass-card shadow-[0_20px_50px_rgba(90,115,210,0.1)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_10px_20px_rgba(59,130,246,0.35)] shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Chatbot Control Center
              {isGuest && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Guest Preview
                </span>
              )}
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Direct administrative overrides, Telegram dispatch, and human takeover controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations()}
            className="px-4 py-2 rounded-2xl glass-pill hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Active Conversations Selector (4 cols) */}
        <div className="lg:col-span-4 rounded-[32px] glass-card flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(90,115,210,0.1)]">
          <div className="p-4 border-b border-white/60 flex items-center justify-between bg-white/40">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Active Threads ({conversations.length})
            </span>
            <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-full bg-blue-50">
              Telegram Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {conversations.map((c) => {
              const isSelected = selectedConvId === String(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConvId(String(c.id))}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-500/10 border-2 border-blue-500 text-slate-900 shadow-sm"
                      : "hover:bg-white/60 text-slate-600 border border-transparent glass-card-hover"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {c.user_name || "Telegram User"}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.handling_mode === "human"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {c.handling_mode === "human" ? "HUMAN MODE" : "AI MODE"}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 truncate">
                    {c.last_message_text || "No preview"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Chat Stream & Control Deck (8 cols) */}
        <div className="lg:col-span-8 rounded-[32px] glass-card flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(90,115,210,0.1)]">
          {/* Thread Header with Mode Controls */}
          <div className="p-4 border-b border-white/60 flex flex-wrap items-center justify-between gap-3 bg-white/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  {convDetail?.conversation.user_name || "Select a conversation"}
                </span>
                {convDetail?.conversation.telegram_username && (
                  <span className="text-xs font-semibold text-blue-600">
                    @{convDetail.conversation.telegram_username}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                Channel: {convDetail?.conversation.platform?.toUpperCase() || "TELEGRAM"} • Messages: {convDetail?.messages.length || 0}
              </span>
            </div>

            {/* Handling Mode Override Buttons */}
            <div className="flex items-center gap-2">
              {convDetail?.conversation.handling_mode === "human" ? (
                <button
                  onClick={() => handleModeSwitch("ai")}
                  disabled={modeLoading}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Return to AI Mode</span>
                </button>
              ) : (
                <button
                  onClick={() => handleModeSwitch("human")}
                  disabled={modeLoading}
                  className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Take Over (Human Mode)</span>
                </button>
              )}
            </div>
          </div>

          {/* Chronological Message Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3 min-h-[380px] max-h-[480px] custom-scrollbar bg-white/20">
            {convDetail?.messages.map((m: any) => {
              const isUser = m.sender_type === "user";
              const isStaff = m.sender_type === "staff";
              const isSystem = m.sender_type === "system";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    isUser
                      ? "items-start"
                      : isStaff
                      ? "items-end"
                      : "items-center"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-slate-400">
                    <span>
                      {isUser ? "Student" : isStaff ? "Staff Admin" : isSystem ? "System" : "AIVA Assistant"}
                    </span>
                    <span>•</span>
                    <span>{m.created_at?.slice(11, 16) || "Now"}</span>
                  </div>

                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                      isUser
                        ? "bg-white/95 border border-white text-slate-800 rounded-tl-none shadow-sm"
                        : isStaff
                        ? "btn-luminous-primary text-white rounded-tr-none shadow-md"
                        : isSystem
                        ? "bg-amber-50 border border-amber-200 text-amber-800 text-center rounded-xl"
                        : "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Input Form for Manual Replies */}
          <div className="p-4 border-t border-white/60 bg-white/60">
            {sendError && (
              <div className="mb-2 p-2.5 rounded-2xl bg-red-100 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}
            {sendSuccess && (
              <div className="mb-2 p-2.5 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sendSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendReply} className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  isGuest
                    ? "Guest Mode: Sign in to send manual replies to Telegram..."
                    : "Type manual reply to Telegram user..."
                }
                className="flex-1 glass-input rounded-full px-4 py-2.5 text-xs font-medium placeholder-slate-400"
              />

              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-6 py-2.5 rounded-full btn-luminous-primary font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isGuest ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? "Sending..." : "Send Reply"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
