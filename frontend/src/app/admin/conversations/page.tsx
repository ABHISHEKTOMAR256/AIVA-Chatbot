"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Search,
  Phone,
  PhoneCall,
  User,
  Bot,
  ShieldAlert,
  Send,
  RefreshCw,
  ExternalLink,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  getLiveConversations,
  getLiveConversationDetail,
  pollConversationMessages,
  replyHandover,
} from "@/lib/api";
import type { AdminConversationItem, AdminConversationDetail } from "@/types";

function LiveConversationsContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [conversations, setConversations] = useState<AdminConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [activeDetail, setActiveDetail] = useState<AdminConversationDetail | null>(null);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [staffReplyText, setStaffReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch conversations list
  const loadConversations = async () => {
    try {
      const res = await getLiveConversations({
        q: search.trim() || undefined,
        page_size: 50,
      });
      setConversations(res.conversations);

      // Auto-select first conversation if none selected
      if (!selectedId && res.conversations.length > 0) {
        setSelectedId(res.conversations[0].id);
      }
    } catch (e) {
      console.error("Failed to load live conversations:", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000); // 15s refresh thread list
    return () => clearInterval(interval);
  }, [search]);

  // 2. Fetch selected conversation detail
  useEffect(() => {
    if (!selectedId) return;

    let isMounted = true;
    setLoadingChat(true);

    getLiveConversationDetail(selectedId)
      .then((detail) => {
        if (isMounted) {
          setActiveDetail(detail);
          setLoadingChat(false);
        }
      })
      .catch((e) => {
        console.error("Failed to load conversation detail:", e);
        if (isMounted) setLoadingChat(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  // 3. Real-time message polling (every 3 seconds)
  useEffect(() => {
    if (!selectedId || !activeDetail) return;

    const pollInterval = setInterval(async () => {
      const msgs = activeDetail.messages;
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg) return;

      try {
        const res = await pollConversationMessages(selectedId, lastMsg.created_at);
        if (res.messages && res.messages.length > 0) {
          setActiveDetail((prev) => {
            if (!prev) return prev;
            // Deduplicate by id
            const existingIds = new Set(prev.messages.map((m) => m.id));
            const newOnes = res.messages.filter((m: any) => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            return {
              ...prev,
              messages: [...prev.messages, ...newOnes],
            };
          });
        }
      } catch (e) {
        // silent polling fail
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [selectedId, activeDetail]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDetail?.messages]);

  const handleStaffSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffReplyText.trim() || !selectedId || !activeDetail) return;

    setSendingReply(true);
    try {
      // If handover is active or direct staff reply
      await replyHandover(selectedId, staffReplyText.trim());

      // Append optimistic message
      const optimisticMsg = {
        id: "temp-" + Date.now(),
        sender_type: "staff" as const,
        content: staffReplyText.trim(),
        message_type: "text",
        created_at: new Date().toISOString(),
      };
      setActiveDetail((prev) =>
        prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev
      );
      setStaffReplyText("");
    } catch (err: any) {
      alert("Failed to send staff reply: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col -m-4 sm:-m-6 lg:-m-8">
      {/* 3-Panel Layout Container */}
      <div className="flex-1 flex overflow-hidden border-t border-slate-800">
        {/* ── LEFT PANEL: Conversation Thread List (28%) ─────────────────── */}
        <div className="w-80 lg:w-96 border-r border-cyan-500/20 bg-[#070b14]/90 flex flex-col shrink-0">
          {/* Search Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or chat..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loadingList ? (
              <div className="p-8 text-center text-xs font-mono text-cyan-400">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                No active conversations found.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === selectedId;
                const isHandover = c.handling_mode === "pending_handover";

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/15 border-l-2 border-cyan-400 shadow-[inset_0_0_20px_rgba(0,240,255,0.08)]"
                        : "hover:bg-slate-900/50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs">
                        {c.user_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      {isHandover && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-medium text-xs text-slate-200 truncate">
                          {c.user_name}
                        </span>
                        {c.last_message_time && (
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(c.last_message_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        {c.telegram_username && (
                          <span className="text-[10px] font-mono text-cyan-400">
                            @{c.telegram_username}
                          </span>
                        )}
                        {c.phone_number && (
                          <span className="text-[9px] font-mono text-emerald-400 px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30">
                            Verified Phone
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {c.last_message_text || "No message preview"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── CENTER PANEL: Live Message Stream (48%) ─────────────────────── */}
        <div className="flex-1 flex flex-col bg-[#030712] relative overflow-hidden">
          {/* Chat Stream Header */}
          <div className="p-3.5 border-b border-slate-800 bg-[#070b14]/70 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-xs">
                {activeDetail?.user_profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{activeDetail?.user_profile?.full_name || "Select conversation"}</span>
                  {activeDetail?.conversation?.handling_mode === "pending_handover" && (
                    <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-400 text-[10px] font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Staff Handover
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Telegram Thread ID: {activeDetail?.conversation?.platform_conversation_id || "N/A"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-poll: 3s</span>
            </div>
          </div>

          {/* Message Stream Scroll Area */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4">
            {loadingChat ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-cyan-400">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  Streaming live messages...
                </div>
              </div>
            ) : !activeDetail ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                Select a conversation from the left panel to begin monitoring.
              </div>
            ) : activeDetail.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                No messages recorded in this conversation yet.
              </div>
            ) : (
              activeDetail.messages.map((m) => {
                const isUser = m.sender_type === "user";
                const isStaff = m.sender_type === "staff";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      isUser ? "items-start" : isStaff ? "items-end" : "items-end"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mb-1 px-1">
                      <span className="font-semibold text-slate-400">
                        {isUser
                          ? activeDetail.user_profile.full_name || "Student"
                          : isStaff
                          ? "Staff Member"
                          : "AIVA Neural Bot"}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      {m.response_time_ms && (
                        <span className="text-cyan-400 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          {Math.round(m.response_time_ms)}ms
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans shadow-md ${
                        isUser
                          ? "bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none"
                          : isStaff
                          ? "bg-emerald-950/70 text-emerald-100 border border-emerald-500/40 rounded-tr-none shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                          : "bg-cyan-950/60 text-cyan-50 border border-cyan-500/30 rounded-tr-none shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Staff Takeover & Reply Bar */}
          <div className="p-3.5 border-t border-slate-800 bg-[#070b14]/80 backdrop-blur-md">
            <form onSubmit={handleStaffSend} className="flex items-center gap-2">
              <input
                type="text"
                value={staffReplyText}
                onChange={(e) => setStaffReplyText(e.target.value)}
                placeholder="Send direct staff reply to this Telegram user..."
                disabled={!selectedId || sendingReply}
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!staffReplyText.trim() || sendingReply}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL: User Telemetry Dossier (24%) ─────────────────── */}
        <div className="hidden lg:flex w-80 border-l border-cyan-500/20 bg-[#070b14]/90 flex-col p-5 space-y-5 overflow-y-auto shrink-0">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
              Student Dossier
            </h3>

            {activeDetail ? (
              <div className="space-y-4">
                {/* Profile Badge */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 mx-auto flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] mb-3 font-mono">
                    {activeDetail.user_profile.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <h4 className="font-bold text-sm text-white">
                    {activeDetail.user_profile.full_name}
                  </h4>
                  {activeDetail.user_profile.telegram_username && (
                    <div className="text-xs font-mono text-cyan-400 mt-0.5">
                      @{activeDetail.user_profile.telegram_username}
                    </div>
                  )}
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Hostel Resident
                  </span>
                </div>

                {/* Contact Phone Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-500">
                    Verified Emergency Contact
                  </span>
                  {activeDetail.user_profile.phone_number ? (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5" />
                        {activeDetail.user_profile.phone_number}
                      </span>
                      <a
                        href={`tel:${activeDetail.user_profile.phone_number}`}
                        className="p-1 rounded bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                      <span>Not shared via /contact</span>
                    </div>
                  )}
                </div>

                {/* Interaction Metrics */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Telegram ID</span>
                    <span className="text-slate-200">
                      {activeDetail.user_profile.telegram_id || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Msgs</span>
                    <span className="text-cyan-400">
                      {activeDetail.user_profile.total_messages_sent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Threads</span>
                    <span className="text-violet-400">
                      {activeDetail.user_profile.total_conversations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Registered</span>
                    <span className="text-slate-300 text-[11px]">
                      {new Date(activeDetail.user_profile.first_interaction).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Direct Telegram Chat Link */}
                {activeDetail.user_profile.telegram_username && (
                  <a
                    href={`https://t.me/${activeDetail.user_profile.telegram_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open in Telegram Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs font-mono text-slate-500 text-center">
                Select a conversation to inspect student profile.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveConversationsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[70vh] flex items-center justify-center text-xs font-mono text-cyan-400">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Loading 3-Panel Control Room...
          </div>
        </div>
      }
    >
      <LiveConversationsContent />
    </Suspense>
  );
}
