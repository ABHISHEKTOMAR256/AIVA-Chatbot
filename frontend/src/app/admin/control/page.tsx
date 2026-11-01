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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Chatbot Control Center
              {isGuest && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Guest Preview
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Direct administrative overrides, Telegram dispatch, and human takeover controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Active Conversations Selector (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Active Threads ({conversations.length})
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Telegram & Web</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {conversations.map((c) => {
              const isSelected = selectedConvId === String(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConvId(String(c.id))}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                      : "hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-white truncate">
                      {c.user_name || "Telegram User"}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        c.handling_mode === "human"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {c.handling_mode === "human" ? "HUMAN MODE" : "AI MODE"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {c.last_message_text || "No preview"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Chat Stream & Control Deck (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Thread Header with Mode Controls */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {convDetail?.conversation.user_name || "Select a conversation"}
                </span>
                {convDetail?.conversation.telegram_username && (
                  <span className="text-xs font-mono text-cyan-400">
                    @{convDetail.conversation.telegram_username}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Channel: {convDetail?.conversation.platform?.toUpperCase() || "TELEGRAM"} • Messages: {convDetail?.messages.length || 0}
              </span>
            </div>

            {/* Handling Mode Override Buttons */}
            <div className="flex items-center gap-2">
              {convDetail?.conversation.handling_mode === "human" ? (
                <button
                  onClick={() => handleModeSwitch("ai")}
                  disabled={modeLoading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5 transition-all"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Return to AI Mode</span>
                </button>
              ) : (
                <button
                  onClick={() => handleModeSwitch("human")}
                  disabled={modeLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-1.5 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Take Over (Human Mode)</span>
                </button>
              )}
            </div>
          </div>

          {/* Chronological Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[380px] max-h-[480px]">
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
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400">
                    <span>
                      {isUser ? "Student" : isStaff ? "Staff Admin" : isSystem ? "System" : "AIVA Assistant"}
                    </span>
                    <span>•</span>
                    <span>{m.created_at?.slice(11, 16) || "Now"}</span>
                  </div>

                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                        : isStaff
                        ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-medium rounded-tr-none shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                        : isSystem
                        ? "bg-amber-950/40 border border-amber-500/30 text-amber-300 text-center"
                        : "bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 rounded-tr-none"
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
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            {sendError && (
              <div className="mb-2 p-2 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}
            {sendSuccess && (
              <div className="mb-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
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
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />

              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all disabled:opacity-50"
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
