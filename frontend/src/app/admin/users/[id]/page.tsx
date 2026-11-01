"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ChevronLeft,
  Phone,
  PhoneCall,
  Calendar,
  MessageSquare,
  Clock,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";
import { getTelegramUserDetail, getTelegramUserMessages } from "@/lib/api";
import type { TelegramUserItem } from "@/types";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<TelegramUserItem | null>(null);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    Promise.allSettled([
      getTelegramUserDetail(userId),
      getTelegramUserMessages(userId, 200),
    ])
      .then(([userRes, msgRes]) => {
        if (userRes.status === "fulfilled") setUser(userRes.value);
        if (msgRes.status === "fulfilled") setMessages(msgRes.value);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-mono text-cyan-400">
        <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-2" />
        Loading student dossier...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-400 space-y-4">
        <div>Student record not found in Telegram directory.</div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Return to Users</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Telegram Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] font-mono">
            {user.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{user.full_name}</span>
              {user.telegram_username && (
                <span className="text-xs font-mono text-cyan-400">
                  @{user.telegram_username}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Telegram ID: {user.telegram_id || "N/A"} • Joined {new Date(user.first_interaction).toLocaleDateString()}
            </p>
          </div>
        </div>

        {user.telegram_username && (
          <a
            href={`https://t.me/${user.telegram_username}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Message on Telegram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Contact & Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-500">Verified Contact Number</span>
          <div className="mt-1 text-sm font-bold">
            {user.phone_number ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4" />
                {user.phone_number}
              </span>
            ) : (
              <span className="text-slate-500 text-xs">Not shared</span>
            )}
          </div>
          {user.phone_shared_at && (
            <div className="text-[10px] text-slate-500 mt-1">
              Consent recorded {new Date(user.phone_shared_at).toLocaleString()}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-500">Messages Sent by Student</span>
          <div className="mt-1 text-2xl font-bold text-cyan-400">
            {user.total_messages_sent}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-500">Total Conversations</span>
          <div className="mt-1 text-2xl font-bold text-violet-400">
            {user.total_conversations}
          </div>
        </div>
      </div>

      {/* Complete Message History Card */}
      <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Chronological Telegram History ({messages.length} messages)</span>
        </h2>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No message logs found.
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender_type === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mb-1">
                    <span>{isUser ? user.full_name || "Student" : "AIVA Assistant"}</span>
                    <span>•</span>
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none"
                        : "bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 rounded-tr-none shadow-[0_0_12px_rgba(0,240,255,0.1)]"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
