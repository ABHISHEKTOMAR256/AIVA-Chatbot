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
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Virtual Assistant Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hostel Helpdesk Dashboard
          </h1>
          <p className="text-sm text-indigo-100 mt-1 max-w-xl">
            Welcome! File issues, track complaint resolution, find lost items, or
            ask questions 24/7.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/chat">
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AIVA
            </Button>
          </Link>
          <Link href="/complaints">
            <Button className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-sm">
              <Plus className="w-4 h-4 mr-1" />
              File Complaint
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Complaints"
          value={stats.total_complaints}
          icon={<AlertCircle className="w-5 h-5 text-indigo-600" />}
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
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          description="Web & Telegram sessions"
          color="blue"
        />
      </div>

      {/* Quick Actions & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Recent Helpdesk Chats
            </h2>
            <Link
              href="/chat"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Chat Room →
            </Link>
          </div>
          <RecentConversations conversations={conversations} />
        </div>

        {/* Quick Help & Lost and Found link */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">Quick Links</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <Link
              href="/complaints"
              className="p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg flex items-center justify-between group transition-colors block"
            >
              <div>
                <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-700">
                  Track My Complaints
                </p>
                <p className="text-[11px] text-gray-400">
                  Check live technician assignment
                </p>
              </div>
              <AlertCircle className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              href="/lost-found"
              className="p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg flex items-center justify-between group transition-colors block"
            >
              <div>
                <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-700">
                  Lost & Found Catalog
                </p>
                <p className="text-[11px] text-gray-400">
                  Report or claim found items
                </p>
              </div>
              <Search className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
            </Link>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Emergency Contact
              </p>
              <p className="text-xs text-gray-500">
                Medical & Security: Ext 1008 / +91-11-2345-6708
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
