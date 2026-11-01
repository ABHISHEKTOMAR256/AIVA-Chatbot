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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Session Management
              {isGuest && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Guest Preview
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Live conversation threads, webhook persistence, and session state continuity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono px-3 py-1.5 rounded-xl outline-none"
          >
            <option value="">All Modes</option>
            <option value="ai">AI Mode Only</option>
            <option value="human">Human Mode Only</option>
            <option value="pending_handover">Pending Handover</option>
          </select>

          <button
            onClick={() => loadSessions()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Session Thread ID</th>
                <th className="py-3 px-4">Student Profile</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Messages</th>
                <th className="py-3 px-4">Session Started</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-cyan-400 font-bold">
                    {String(s.id).slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-white">{s.user_name}</div>
                    {s.telegram_username && (
                      <div className="text-[10px] text-slate-400 font-mono">@{s.telegram_username}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 uppercase text-[10px]">
                      {s.platform}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
                        s.handling_mode === "human"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {s.handling_mode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-200">{s.message_count}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {s.created_at?.slice(0, 16).replace("T", " ") || "Recently"}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 text-[11px]">
                    {s.updated_at?.slice(11, 16) || "Active"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isAdmin ? (
                      <Link
                        href={`/admin/control?id=${s.id}`}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-[11px] inline-flex items-center gap-1"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => requireAuth("Inspect live session thread telemetry")}
                        className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-[11px] inline-flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3 text-cyan-400" />
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
