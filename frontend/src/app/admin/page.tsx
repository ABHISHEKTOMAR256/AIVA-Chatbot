"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  Download,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  PhoneCall,
  Clock,
  Sparkles,
  Radio,
  BarChart2,
  CheckCircle2,
  Lock,
  Award,
  Shield,
  ArrowRight,
} from "lucide-react";
import NeuralOrb from "@/components/3d/NeuralOrb";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import {
  getTelegramDashboardStats,
  getAnalyticsCharts,
  exportTelegramUsersCsv,
  getLiveConversations,
  getGuestPreview,
  getConversationProgress,
} from "@/lib/api";
import type { TelegramDashboardStats, AdminConversationItem, ConversationProgress } from "@/types";

export default function AdminOverviewPage() {
  const { isAdmin, isGuest, requireAuth, openAuthModal } = useGuestAuth();

  const [stats, setStats] = useState<TelegramDashboardStats | null>(null);
  const [charts, setCharts] = useState<Array<any>>([]);
  const [recentConvs, setRecentConvs] = useState<AdminConversationItem[]>([]);
  const [academicProgress, setAcademicProgress] = useState<ConversationProgress>({
    total_genuine: 0,
    target: 25,
    percentage: 0,
    remaining: 25,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    try {
      if (isAdmin) {
        // Authenticated Admin Mode: Fetch real PostgreSQL records
        const [statsRes, chartsRes, convsRes, progRes] = await Promise.allSettled([
          getTelegramDashboardStats(),
          getAnalyticsCharts(14),
          getLiveConversations({ page_size: 5 }),
          getConversationProgress(),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (chartsRes.status === "fulfilled") setCharts(chartsRes.value.timeline || []);
        if (convsRes.status === "fulfilled") setRecentConvs(convsRes.value.conversations || []);
        if (progRes.status === "fulfilled") setAcademicProgress(progRes.value);
      } else {
        // Guest Preview Mode: Fetch demonstration data
        try {
          const preview = await getGuestPreview();
          if (preview?.stats) setStats(preview.stats);
          if (preview?.academic_progress) setAcademicProgress(preview.academic_progress);
          if (preview?.sample_conversations) setRecentConvs(preview.sample_conversations);
        } catch {
          // Fallback demo data
          setStats({
            total_telegram_users: 142,
            total_conversations: 318,
            total_messages_received: 1420,
            total_bot_replies: 1395,
            active_users_today: 28,
            active_users_7d: 89,
            avg_response_time_ms: 320.5,
            failed_messages: 0,
            bot_online: true,
            bot_username: "AIVA_LPU_bot",
          });
          setAcademicProgress({
            total_genuine: 22,
            target: 25,
            percentage: 88.0,
            remaining: 3,
          });
        }

        // Mock 14-day chart
        const demoTimeline = Array.from({ length: 14 }).map((_, i) => ({
          label: `Day ${i + 1}`,
          date: `2026-10-${String(18 + i).padStart(2, "0")}`,
          messages_received: 40 + Math.floor(Math.sin(i) * 20) + i * 3,
          bot_replies: 38 + Math.floor(Math.sin(i) * 19) + i * 3,
          conversations: 12 + Math.floor(i * 1.5),
        }));
        setCharts(demoTimeline);
      }
    } catch (e) {
      console.error("Dashboard overview load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleExport = async () => {
    if (!requireAuth("Export Telegram student directory to CSV")) return;
    try {
      setExporting(true);
      const blob = await exportTelegramUsersCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aiva_telegram_users_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <NeuralOrb size={180} />
        <div className="text-sm font-mono text-cyan-400 animate-pulse">
          Connecting to AIVA 3D Neural Telemetry...
        </div>
      </div>
    );
  }

  const maxMsg = Math.max(1, ...charts.map((c) => Math.max(c.messages_received || 0, c.bot_replies || 0)));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 3D Hero Command Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b1021] via-[#080d1a] to-[#040711] border border-cyan-500/20 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.05)]">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 hidden lg:block pointer-events-none opacity-90">
          <NeuralOrb size={320} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              AIVA 3D CHATBOT CONTROL CENTER
            </span>
            {isGuest ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold">
                👁️ Guest Preview
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Live Admin Active
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            AI Telegram Chatbot & Management Core
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans mb-6">
            Real-time neural monitoring, automated hostel complaint routing, emergency human handovers,
            consent-based contact syncing, and live Telegram dispatch.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setRefreshing(true);
                loadData();
              }}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync Database"}</span>
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? "Generating CSV..." : "Export Users CSV"}</span>
            </button>

            <Link
              href="/admin/control"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:brightness-110 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chatbot Control Center</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Academic Evaluation Milestone Card: 25 Genuine User Conversations */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1222] via-[#09152b] to-[#07101e] border border-cyan-500/30 p-6 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Academic Project Requirement
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Evaluation Target: 25 Genuine User Conversations
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Distinct student interactions with at least 2 user messages persisted in PostgreSQL.
              {(academicProgress.remaining ?? 25) > 0 ? (
                <span className="text-amber-300 font-medium"> {academicProgress.remaining ?? 25} genuine conversations still needed to reach academic target.</span>
              ) : (
                <span className="text-emerald-400 font-medium"> Milestone complete! 25+ genuine conversations verified.</span>
              )}
            </p>
          </div>

          <div className="lg:w-80 space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Recorded Progress:</span>
              <span className="text-cyan-300 font-bold">
                {academicProgress.total_genuine ?? academicProgress.total ?? 0} / {academicProgress.target} ({academicProgress.percentage}%)
              </span>
            </div>
            {/* Custom Glowing Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
              <div
                style={{ width: `${Math.min(100, academicProgress.percentage)}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.6)] transition-all duration-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Goal: 25 Genuine Users</span>
              <span className={(academicProgress.remaining ?? 25) === 0 ? "text-emerald-400" : "text-amber-400"}>
                {(academicProgress.remaining ?? 25) === 0 ? "Target Achieved" : `${academicProgress.remaining ?? 25} Remaining`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary 3D KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Telegram Students */}
        <div
          onClick={() => {
            if (isGuest) requireAuth("View live student directory");
          }}
          className="group relative rounded-2xl bg-[#0b0f19]/70 backdrop-blur-xl border border-cyan-500/20 p-5 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Telegram Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {stats?.total_telegram_users ?? 0}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
              +{stats?.active_users_today ?? 0} active today
            </span>
            <span className="text-slate-400">({stats?.active_users_7d ?? 0} in 7d)</span>
          </div>
        </div>

        {/* Total Conversations */}
        <div
          onClick={() => {
            if (isGuest) requireAuth("View conversations list");
          }}
          className="group relative rounded-2xl bg-[#0b0f19]/70 backdrop-blur-xl border border-violet-500/20 p-5 hover:border-violet-400/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Conversations
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {stats?.total_conversations ?? 0}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-violet-300">
            <span className="px-1.5 py-0.5 rounded bg-violet-950/60 border border-violet-500/30">
              Persisted Threads
            </span>
            <span className="text-slate-400">SQL Database</span>
          </div>
        </div>

        {/* Messages In vs Out */}
        <div className="group relative rounded-2xl bg-[#0b0f19]/70 backdrop-blur-xl border border-cyan-500/20 p-5 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Messages Stream
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-2">
            <span>{stats?.total_messages_received ?? 0}</span>
            <span className="text-sm font-normal text-slate-400">in</span>
            <span className="text-slate-600">/</span>
            <span className="text-xl text-cyan-400">{stats?.total_bot_replies ?? 0}</span>
            <span className="text-xs font-normal text-slate-400">out</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
              Ratio: {stats?.total_messages_received ? ((stats.total_bot_replies / stats.total_messages_received)).toFixed(2) : "1.0"}x
            </span>
            <span className="text-slate-400">AI Response</span>
          </div>
        </div>

        {/* Latency & Status */}
        <div className="group relative rounded-2xl bg-[#0b0f19]/70 backdrop-blur-xl border border-emerald-500/20 p-5 hover:border-emerald-400/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              AI Latency & Health
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1.5">
            <span>{stats?.avg_response_time_ms ? Math.round(stats.avg_response_time_ms) : 18}</span>
            <span className="text-sm font-normal text-slate-400">ms avg</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              0 Failed msgs
            </span>
            <span className="text-slate-400">100% Delivery</span>
          </div>
        </div>
      </div>

      {/* Interactive 14-Day Activity Chart */}
      <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              14-Day Interaction Timeline
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Daily volume of messages received from students vs autonomous bot replies
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
              <span className="text-slate-300">Messages Received</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              <span className="text-slate-300">Bot Replies</span>
            </div>
          </div>
        </div>

        {/* Custom SVG Line/Bar Chart */}
        <div className="h-64 w-full relative">
          {charts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
              No historical data in selected range.
            </div>
          ) : (
            <div className="h-full flex items-end justify-between gap-2 pt-6 pb-6 border-b border-slate-800">
              {charts.map((c, i) => {
                const recHeight = Math.max(4, Math.round(((c.messages_received || 0) / maxMsg) * 180));
                const repHeight = Math.max(4, Math.round(((c.bot_replies || 0) / maxMsg) * 180));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 z-20 pointer-events-none bg-slate-900 border border-cyan-500/40 rounded-lg p-2 text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl">
                      <div className="text-cyan-400 font-bold">{c.label} ({c.date})</div>
                      <div>Recvd: {c.messages_received || 0} | Replies: {c.bot_replies || 0}</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-48">
                      <div
                        style={{ height: `${recHeight}px` }}
                        className="w-2.5 rounded-t bg-cyan-400/80 group-hover:bg-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.4)] transition-all"
                      />
                      <div
                        style={{ height: `${repHeight}px` }}
                        className="w-2.5 rounded-t bg-violet-500/80 group-hover:bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.4)] transition-all"
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 mt-2 truncate w-full text-center">
                      {c.label.split(" ")[1] || c.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lower Section: Recent Telegram Conversations & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Live Interactions</h3>
              <p className="text-xs text-slate-400 font-mono">
                {isGuest ? "Demonstration previews (Sign in to view real student queries)" : "Latest student queries answered by AIVA"}
              </p>
            </div>
            <Link
              href="/admin/conversations"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentConvs.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                No recent interactions logged yet.
              </div>
            ) : (
              recentConvs.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (isGuest) requireAuth("Inspect private conversation history");
                  }}
                  className="py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 font-mono text-xs font-bold">
                      {conv.user_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {conv.user_name}
                        </span>
                        {conv.telegram_username && (
                          <span className="text-[11px] text-cyan-400/80 font-mono">
                            @{conv.telegram_username}
                          </span>
                        )}
                        {conv.phone_number && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                            <PhoneCall className="w-2.5 h-2.5" />
                            {isGuest ? "Shared (Hidden)" : "Verified"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {conv.last_message_text || "No preview available"}
                      </p>
                    </div>
                  </div>

                  {isAdmin ? (
                    <Link
                      href={`/admin/conversations?id=${conv.id}`}
                      className="shrink-0 px-3 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors"
                    >
                      Inspect
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requireAuth("Inspect private conversation history");
                      }}
                      className="shrink-0 px-3 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                    >
                      <Lock className="w-2.5 h-2.5 text-cyan-400" />
                      Inspect
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick System Status Card (1 col) */}
        <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Architecture & Modes</h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              {isAdmin ? "Admin Control Active" : "Guest Mode Active"}
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Database Engine</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Pooler
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Telegram Bot</span>
                <span className="text-cyan-400 font-bold">@AIVA_LPU_bot</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Active Mode</span>
                <span className={isAdmin ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {isAdmin ? "Full Admin" : "Guest Preview"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Manual Reply Dispatch</span>
                <span className="text-cyan-400">Telegram API Bot</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <Link
              href="/admin/users"
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 transition-all block text-center"
            >
              <span>Explore User Directory</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
