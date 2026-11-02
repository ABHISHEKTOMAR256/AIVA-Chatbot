"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Lock,
  User,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import { getAdminSessions } from "@/lib/api";

export default function SessionsPage() {
  const { isAdmin, isGuest, requireAuth } = useGuestAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("");

  const loadSessions = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await getAdminSessions();
        setSessions(res.sessions || []);
      } else {
        // Guest Demo Sessions
        setSessions([
          {
            id: "sess-8491-a",
            user_name: "Aman Sharma (Demo)",
            telegram_username: "aman_s",
            platform: "telegram",
            status: "active",
            handling_mode: "ai",
            message_count: 6,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 600000).toISOString(),
          },
          {
            id: "sess-2194-b",
            user_name: "Priya Patel (Demo)",
            telegram_username: "priya_p",
            platform: "telegram",
            status: "active",
            handling_mode: "human",
            message_count: 14,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            updated_at: new Date(Date.now() - 1200000).toISOString(),
          },
          {
            id: "sess-9043-c",
            user_name: "Vikram Sethi (Demo)",
            telegram_username: "vikram_sethi",
            platform: "telegram",
            status: "closed",
            handling_mode: "ai",
            message_count: 4,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 82000000).toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [isAdmin]);

  const filteredSessions = sessions.filter((s) => {
    if (!filterMode) return true;
    return s.handling_mode === filterMode;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Session Management
              {isGuest && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 font-medium">
                  Guest Preview
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Live conversation threads, webhook persistence, and session state continuity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="glass-card text-slate-700 text-xs font-medium px-4 py-2 rounded-full outline-none shadow-sm cursor-pointer"
          >
            <option value="">All Modes</option>
            <option value="ai">AI Mode Only</option>
            <option value="human">Human Mode Only</option>
            <option value="pending_handover">Pending Handover</option>
          </select>

          <button
            onClick={() => loadSessions()}
            className="px-4 py-2 rounded-full glass-card hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-3xl glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-white/40 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-4 px-5">Session Thread ID</th>
                <th className="py-4 px-5">Student Profile</th>
                <th className="py-4 px-5">Channel</th>
                <th className="py-4 px-5">Mode</th>
                <th className="py-4 px-5">Messages</th>
                <th className="py-4 px-5">Session Started</th>
                <th className="py-4 px-5">Last Activity</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-4 px-5 text-blue-600 font-mono font-bold">
                    {String(s.id).slice(0, 8)}...
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-semibold text-slate-900">{s.user_name}</div>
                    {s.telegram_username && (
                      <div className="text-[10px] text-slate-400 font-medium">@{s.telegram_username}</div>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold border border-slate-200/60">
                      {s.platform}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-3 py-1 rounded-full uppercase text-[10px] font-semibold ${
                        s.handling_mode === "human"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-blue-50 text-blue-700 border border-blue-200/60"
                      }`}
                    >
                      {s.handling_mode}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-800">{s.message_count}</td>
                  <td className="py-4 px-5 text-slate-500 text-xs font-medium">
                    {s.created_at?.slice(0, 16).replace("T", " ") || "Recently"}
                  </td>
                  <td className="py-4 px-5 text-emerald-600 text-xs font-medium">
                    {s.updated_at?.slice(11, 16) || "Active"}
                  </td>
                  <td className="py-4 px-5 text-right">
                    {isAdmin ? (
                      <Link
                        href={`/admin/control?id=${s.id}`}
                        className="px-3.5 py-1.5 rounded-full glass-card hover:bg-white text-blue-600 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => requireAuth("Inspect live session thread telemetry")}
                        className="px-3.5 py-1.5 rounded-full glass-card hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Lock className="w-3 h-3 text-amber-600" />
                        Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
