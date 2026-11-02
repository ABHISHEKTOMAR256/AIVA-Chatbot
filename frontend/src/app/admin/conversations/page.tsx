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
  sendManualReply,
} from "@/lib/api";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import type { AdminConversationItem, AdminConversationDetail } from "@/types";

function LiveConversationsContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const { isAdmin, isGuest, requireAuth } = useGuestAuth();

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
      if (isAdmin) {
        const res = await getLiveConversations({
          q: search.trim() || undefined,
          page_size: 50,
        });
        setConversations(res.conversations);

        if (!selectedId && res.conversations.length > 0) {
          setSelectedId(res.conversations[0].id);
        }
      } else {
        // Guest Demo Conversations
        const demoList: any[] = [
          {
            id: "demo-conv-1",
            user_name: "Aman Sharma (Demo)",
            telegram_username: "aman_s",
            platform: "telegram",
            status: "active",
            handling_mode: "ai",
            message_count: 4,
            last_message_text: "Where can I report Wi-Fi router issues?",
            created_at: new Date().toISOString(),
          },
          {
            id: "demo-conv-2",
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
        if (!selectedId) setSelectedId("demo-conv-1");
      }
    } catch (e) {
      console.error("Failed to load live conversations:", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
    if (isAdmin) {
      const interval = setInterval(loadConversations, 15000);
      return () => clearInterval(interval);
    }
  }, [search, isAdmin]);

  // 2. Fetch selected conversation detail
  useEffect(() => {
    if (!selectedId) return;

    if (isAdmin) {
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
    } else {
      // Guest demo thread
      setActiveDetail({
        conversation: {
          id: selectedId as any,
          user_id: "demo-user" as any,
          user_name: selectedId === "demo-conv-2" ? "Priya Patel (Demo)" : "Aman Sharma (Demo)",
          telegram_username: selectedId === "demo-conv-2" ? "priya_p" : "aman_s",
          platform: "telegram",
          status: "active",
          handling_mode: selectedId === "demo-conv-2" ? "human" : "ai",
          message_count: 3,
          created_at: new Date().toISOString() as any,
        },
        messages: [
          {
            id: "1",
            sender_type: "user",
            content: "Hello, I am asking about hostel complaint tracking.",
            message_type: "text",
            created_at: "10:14 AM",
          },
          {
            id: "2",
            sender_type: "ai",
            content: "You can track complaint tickets with /status <REF-ID> anytime!",
            message_type: "text",
            created_at: "10:14 AM",
          },
          {
            id: "3",
            sender_type: "user",
            content: "Got it, thank you!",
            message_type: "text",
            created_at: "10:15 AM",
          },
        ],
        user_profile: {
          id: "demo-user" as any,
          full_name: selectedId === "demo-conv-2" ? "Priya Patel (Demo)" : "Aman Sharma (Demo)",
          telegram_username: selectedId === "demo-conv-2" ? "priya_p" : "aman_s",
          email: "student@telegram.local",
          phone_number: "+91 98765 43210 (Guest Hidden)",
          first_interaction: new Date() as any,
          status: "active",
          total_conversations: 2,
          total_messages_sent: 5,
        },
      });
    }
  }, [selectedId, isAdmin]);

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
    if (!requireAuth("Send manual reply directly to student")) return;

    setSendingReply(true);
    try {
      try {
        await sendManualReply(selectedId, staffReplyText.trim());
      } catch {
        await replyHandover(selectedId, staffReplyText.trim());
      }

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
    <div className="h-[calc(100vh-8.5rem)] glass-card rounded-[32px] overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(90,115,210,0.14)] border border-white/80">
      {/* 3-Panel Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT PANEL: Conversation Thread List (28%) ─────────────────── */}
        <div className="w-80 lg:w-96 border-r border-white/60 bg-white/40 flex flex-col shrink-0">
          {/* Search Header */}
          <div className="p-3.5 border-b border-white/60 bg-white/50">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or chat..."
                className="w-full pl-9 pr-3 py-2 glass-input rounded-full text-xs font-medium placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/60">
            {loadingList ? (
              <div className="p-8 text-center text-xs font-semibold text-blue-600">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
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
                        ? "bg-blue-500/10 border-l-4 border-blue-600 shadow-sm"
                        : "hover:bg-white/60 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {c.user_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      {isHandover && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {c.user_name}
                        </span>
                        {c.last_message_time && (
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {new Date(c.last_message_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        {c.telegram_username && (
                          <span className="text-[10px] font-semibold text-blue-600">
                            @{c.telegram_username}
                          </span>
                        )}
                        {c.phone_number && (
                          <span className="text-[9px] font-bold text-emerald-700 px-1.5 py-0.5 rounded-full bg-emerald-100">
                            Verified Phone
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-medium text-slate-500 truncate">
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
        <div className="flex-1 flex flex-col bg-white/20 relative overflow-hidden">
          {/* Chat Stream Header */}
          <div className="p-3.5 border-b border-white/60 bg-white/60 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {activeDetail?.user_profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span>{activeDetail?.user_profile?.full_name || "Select conversation"}</span>
                  {activeDetail?.conversation?.handling_mode === "pending_handover" && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Staff Handover
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Telegram Thread ID: {activeDetail?.conversation?.platform_conversation_id || "N/A"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-emerald-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-poll: 3s</span>
            </div>
          </div>

          {/* Message Stream Scroll Area */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4 custom-scrollbar">
            {loadingChat ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-blue-600">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Streaming live messages...
                </div>
              </div>
            ) : !activeDetail ? (
              <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
                Select a conversation from the left panel to begin monitoring.
              </div>
            ) : activeDetail.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
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
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-600">
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
                        <span className="text-blue-600 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          {Math.round(m.response_time_ms)}ms
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-[20px] px-4 py-3 text-xs leading-relaxed font-medium shadow-md ${
                        isUser
                          ? "bg-white/95 text-slate-800 border border-white rounded-tl-none"
                          : isStaff
                          ? "btn-luminous-primary rounded-tr-none text-white"
                          : "bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-tr-none text-white"
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
          <div className="p-3.5 border-t border-white/60 bg-white/70 backdrop-blur-md">
            <form onSubmit={handleStaffSend} className="flex items-center gap-2">
              <input
                type="text"
                value={staffReplyText}
                onChange={(e) => setStaffReplyText(e.target.value)}
                placeholder="Send direct staff reply to this Telegram user..."
                disabled={!selectedId || sendingReply}
                className="flex-1 px-4 py-2.5 glass-input rounded-full text-xs font-medium placeholder-slate-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!staffReplyText.trim() || sendingReply}
                className="px-5 py-2.5 rounded-full btn-luminous-primary font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL: User Telemetry Dossier (24%) ─────────────────── */}
        <div className="hidden lg:flex w-80 border-l border-white/60 bg-white/40 flex-col p-5 space-y-5 overflow-y-auto custom-scrollbar shrink-0">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Student Dossier
            </h3>

            {activeDetail ? (
              <div className="space-y-4">
                {/* Profile Badge */}
                <div className="p-4 rounded-2xl glass-card text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white font-bold text-xl shadow-md mb-3">
                    {activeDetail.user_profile.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {activeDetail.user_profile.full_name}
                  </h4>
                  {activeDetail.user_profile.telegram_username && (
                    <div className="text-xs font-semibold text-blue-600 mt-0.5">
                      @{activeDetail.user_profile.telegram_username}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs font-medium text-slate-600 glass-card p-3.5 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Messages</span>
                    <span className="font-bold text-slate-900">{activeDetail.user_profile.total_messages_sent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conversations</span>
                    <span className="font-bold text-slate-900">{activeDetail.user_profile.total_conversations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone Status</span>
                    <span className="font-bold text-emerald-600">
                      {activeDetail.user_profile.phone_number ? "Verified" : "Not Provided"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No student selected</p>
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
