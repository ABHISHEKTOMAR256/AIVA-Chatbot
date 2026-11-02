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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 shadow-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Telegram Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="rounded-3xl glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
            {user.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <span>{user.full_name}</span>
              {user.telegram_username && (
                <span className="text-xs font-semibold text-blue-600">
                  @{user.telegram_username}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Telegram ID: {user.telegram_id || "N/A"} • Joined {new Date(user.first_interaction).toLocaleDateString()}
            </p>
          </div>
        </div>

        {user.telegram_username && (
          <a
            href={`https://t.me/${user.telegram_username}`}
            target="_blank"
            rel="noreferrer"
            className="btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Message on Telegram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Contact & Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
        <div className="p-5 rounded-3xl glass-card space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Verified Contact Number</span>
          <div className="mt-1 text-sm font-bold">
            {user.phone_number ? (
              <span className="text-emerald-700 flex items-center gap-1.5 font-mono">
                <PhoneCall className="w-4 h-4" />
                {user.phone_number}
              </span>
            ) : (
              <span className="text-slate-400 text-xs font-medium">Not shared</span>
            )}
          </div>
          {user.phone_shared_at && (
            <div className="text-[10px] text-slate-400 mt-1">
              Consent recorded {new Date(user.phone_shared_at).toLocaleString()}
            </div>
          )}
        </div>

        <div className="p-5 rounded-3xl glass-card space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Messages Sent by Student</span>
          <div className="mt-1 text-3xl font-extrabold text-blue-600 font-mono">
            {user.total_messages_sent}
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Total Conversations</span>
          <div className="mt-1 text-3xl font-extrabold text-purple-600 font-mono">
            {user.total_conversations}
          </div>
        </div>
      </div>

      {/* Complete Message History Card */}
      <div className="rounded-3xl glass-card p-7 space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Chronological Telegram History ({messages.length} messages)</span>
        </h2>

        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-400">
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
                  <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 mb-1">
                    <span>{isUser ? user.full_name || "Student" : "AIVA Assistant"}</span>
                    <span>•</span>
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? "glass-card text-slate-800 rounded-tl-none border border-white/90"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
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
