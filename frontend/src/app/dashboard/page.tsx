"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getDashboardStats, getConversations } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import type { Conversation, DashboardStats as StatsType } from "@/types";

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<StatsType>({
    total_complaints: 0,
    open_complaints: 0,
    resolved_complaints: 0,
    total_conversations: 0,
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, convsData] = await Promise.allSettled([
          getDashboardStats(),
          getConversations(),
        ]);

        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        }
        if (convsData.status === "fulfilled") {
          setConversations(convsData.value);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 border border-blue-200/60 rounded-full text-xs font-semibold text-blue-700 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>AI Virtual Assistant Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hostel Helpdesk Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
            Welcome! File issues, track complaint resolution, find lost items, or
            ask questions 24/7.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/chat">
            <button className="px-5 py-2.5 rounded-full glass-card hover:bg-white text-blue-600 font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all">
              <MessageSquare className="w-4 h-4" />
              <span>Ask AIVA</span>
            </button>
          </Link>
          <Link href="/complaints">
            <button className="btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>File Complaint</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Complaints"
          value={stats.total_complaints}
          icon={<AlertCircle className="w-5 h-5 text-blue-600" />}
          description="Registered by you"
          color="indigo"
        />
        <StatsCard
          title="Open Issues"
          value={stats.open_complaints}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          description="In progress or submitted"
          color="amber"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved_complaints}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          description="Fixed by hostel team"
          color="emerald"
        />
        <StatsCard
          title="Conversations"
          value={stats.total_conversations}
          icon={<MessageSquare className="w-5 h-5 text-cyan-600" />}
          description="Web & Telegram sessions"
          color="blue"
        />
      </div>

      {/* Quick Actions & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Recent Helpdesk Chats
            </h2>
            <Link
              href="/chat"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Open Chat Room →
            </Link>
          </div>
          <RecentConversations conversations={conversations} />
        </div>

        {/* Quick Help & Lost and Found link */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Quick Links</h2>
          <div className="glass-card rounded-3xl p-6 space-y-3.5 border border-white/80">
            <Link
              href="/complaints"
              className="p-3.5 bg-white/60 hover:bg-white rounded-2xl flex items-center justify-between group transition-all block border border-white/70 shadow-sm"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  Track My Complaints
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Check live technician assignment
                </p>
              </div>
              <AlertCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link
              href="/lost-found"
              className="p-3.5 bg-white/60 hover:bg-white rounded-2xl flex items-center justify-between group transition-all block border border-white/70 shadow-sm"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Lost &amp; Found Catalog
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Report or claim found items
                </p>
              </div>
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </Link>

            <div className="pt-3 border-t border-slate-200/70">
              <p className="text-xs font-bold text-slate-800 mb-1">
                Emergency Contact
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Medical &amp; Security: Ext 1008 / +91-11-2345-6708
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
