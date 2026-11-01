"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getAdminStats, exportAnalytics, getConversationProgress } from "@/lib/api";
import {
  Users,
  MessageSquare,
  AlertCircle,
  Clock,
  UserCheck,
  Download,
  Shield,
  Send,
  Globe,
} from "lucide-react";
import type { AdminStats, ConversationProgress } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [progress, setProgress] = useState<ConversationProgress>({
    total: 0,
    target: 25,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, progressData] = await Promise.allSettled([
          getAdminStats(),
          getConversationProgress(),
        ]);

        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        }
        if (progressData.status === "fulfilled") {
          setProgress(progressData.value);
        }
      } catch (e) {
        console.error("Admin dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportAnalytics();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aiva_analytics_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to export analytics: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3 h-3 text-amber-600" />
            Hostel Administration Portal
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            System Overview & Real-Time Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Database-backed statistics for live evaluation and administrative control.
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-sm"
        >
          <Download className="w-4 h-4 mr-2 text-gray-500" />
          {exporting ? "Generating..." : "Export CSV Data"}
        </Button>
      </div>

      {/* 25-Conversation Progress Requirement Bar */}
      <ProgressBar
        current={progress.total}
        target={progress.target}
        label="25 Genuine User Conversations Requirement (Live Evaluation)"
      />

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatsCard
          title="Registered Users"
          value={stats?.total_users ?? 0}
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          description="Verified student accounts"
          color="indigo"
        />
        <StatsCard
          title="Total Conversations"
          value={stats?.total_conversations ?? 0}
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          description="Across Web & Telegram"
          color="blue"
        />
        <StatsCard
          title="Total Messages"
          value={stats?.total_messages ?? 0}
          icon={<MessageSquare className="w-5 h-5 text-indigo-600" />}
          description="User queries & AI responses"
          color="indigo"
        />
        <StatsCard
          title="Hostel Complaints"
          value={stats?.total_complaints ?? 0}
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          description={`${stats?.open_complaints ?? 0} currently open`}
          color="amber"
        />
        <StatsCard
          title="Pending Handovers"
          value={stats?.pending_handovers ?? 0}
          icon={<UserCheck className="w-5 h-5 text-red-600" />}
          description="Students requesting staff"
          color="amber"
        />
        <StatsCard
          title="Avg AI Response Time"
          value={`${(stats?.avg_response_time_seconds ?? 0).toFixed(2)}s`}
          icon={<Clock className="w-5 h-5 text-emerald-600" />}
          description="Ollama local LLM latency"
          color="emerald"
        />
      </div>

      {/* Platform & Common Categories Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            Platform Channel Breakdown
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-800">Next.js Web Portal</span>
              </div>
              <span className="text-xs font-bold text-gray-900">
                {stats?.platform_usage?.find((p) => p.platform === "web")?.count ?? 0} sessions
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-gray-800">Telegram Bot Webhook</span>
              </div>
              <span className="text-xs font-bold text-gray-900">
                {stats?.platform_usage?.find((p) => p.platform === "telegram")?.count ?? 0} sessions
              </span>
            </div>
          </div>
        </div>

        {/* Common Issue Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Most Frequent Complaint Categories
          </h3>

          <div className="space-y-2">
            {stats?.common_categories && stats.common_categories.length > 0 ? (
              stats.common_categories.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-none"
                >
                  <span className="font-semibold text-gray-700 capitalize">
                    {c.category.replace("_", " ")}
                  </span>
                  <span className="font-bold text-indigo-600">{c.count} complaints</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">
                No complaint category data recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
