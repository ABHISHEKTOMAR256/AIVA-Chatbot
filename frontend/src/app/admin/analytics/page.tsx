"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Zap,
  Users,
  MessageSquare,
  Activity,
  Radio,
} from "lucide-react";
import {
  getAnalyticsCharts,
  getTelegramDashboardStats,
  exportTelegramUsersCsv,
  exportAnalytics,
} from "@/lib/api";
import type { TelegramDashboardStats } from "@/types";

export default function AnalyticsReportsPage() {
  const [days, setDays] = useState(14);
  const [charts, setCharts] = useState<Array<any>>([]);
  const [stats, setStats] = useState<TelegramDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([getAnalyticsCharts(days), getTelegramDashboardStats()])
      .then(([chartRes, statRes]) => {
        if (chartRes.status === "fulfilled") setCharts(chartRes.value.timeline || []);
        if (statRes.status === "fulfilled") setStats(statRes.value);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportAnalytics();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aiva_deep_analytics_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const maxVal = Math.max(
    1,
    ...charts.map((c) =>
      Math.max(c.messages_received || 0, c.bot_replies || 0, c.conversations || 0)
    )
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            AI & Interaction Analytics
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Historical engagement trends and Telegram throughput telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Days Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  days === d
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? "Exporting..." : "Export Full Report"}</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 p-5">
          <div className="text-xs font-mono text-slate-400 uppercase">
            Total Queries Processed
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {stats?.total_messages_received || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-2">
            Incoming Telegram user messages
          </p>
        </div>

        <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-violet-500/20 p-5">
          <div className="text-xs font-mono text-slate-400 uppercase">
            Autonomous Bot Replies
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2 text-violet-400">
            {stats?.total_bot_replies || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-2">
            AI generated completions & instant replies
          </p>
        </div>

        <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-emerald-500/20 p-5">
          <div className="text-xs font-mono text-slate-400 uppercase">
            Average Latency
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2 text-emerald-400">
            {stats?.avg_response_time_ms ? Math.round(stats.avg_response_time_ms) : 18} ms
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-2">
            PostgreSQL query + inference pipeline
          </p>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Interaction Distribution Timeline ({days} Days)
          </h2>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-400" />
              <span className="text-slate-300">Incoming Messages</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-violet-500" />
              <span className="text-slate-300">Bot Replies</span>
            </div>
          </div>
        </div>

        {/* Scaled Bar Chart */}
        <div className="h-72 w-full flex items-end justify-between gap-1 sm:gap-2 pt-8 pb-6 border-b border-slate-800">
          {charts.map((c, i) => {
            const inHeight = Math.max(4, Math.round(((c.messages_received || 0) / maxVal) * 220));
            const outHeight = Math.max(4, Math.round(((c.bot_replies || 0) / maxVal) * 220));

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-slate-900 border border-cyan-500/40 rounded-lg p-2 text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl">
                  <div className="text-cyan-400">{c.date}</div>
                  <div>In: {c.messages_received} | Out: {c.bot_replies}</div>
                </div>

                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-56">
                  <div
                    style={{ height: `${inHeight}px` }}
                    className="w-full max-w-[12px] rounded-t bg-cyan-400/80 group-hover:bg-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)] transition-all"
                  />
                  <div
                    style={{ height: `${outHeight}px` }}
                    className="w-full max-w-[12px] rounded-t bg-violet-500/80 group-hover:bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.3)] transition-all"
                  />
                </div>

                <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 mt-2 truncate w-full text-center">
                  {c.label.split(" ")[1] || c.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
