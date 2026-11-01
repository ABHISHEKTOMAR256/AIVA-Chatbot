"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Download,
  Phone,
  PhoneCall,
  Calendar,
  MessageSquare,
  Shield,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  getTelegramUsers,
  getTelegramUserMessages,
  exportTelegramUsersCsv,
} from "@/lib/api";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import type { TelegramUserItem } from "@/types";

export default function TelegramUsersPage() {
  const { isAdmin, isGuest, requireAuth } = useGuestAuth();

  const [users, setUsers] = useState<TelegramUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [hasPhoneFilter, setHasPhoneFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Selected user for drawer/modal
  const [selectedUser, setSelectedUser] = useState<TelegramUserItem | null>(null);
  const [userMessages, setUserMessages] = useState<Array<any>>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const phoneParam =
          hasPhoneFilter === "shared"
            ? true
            : hasPhoneFilter === "none"
            ? false
            : undefined;

        const res = await getTelegramUsers({
          q: search.trim() || undefined,
          has_phone: phoneParam,
          page,
          page_size: pageSize,
        });

        setUsers(res.users);
        setTotal(res.total);
      } else {
        // Guest Demo Directory
        const demoUsers: TelegramUserItem[] = [
          {
            id: "demo-u-1" as any,
            telegram_id: 99887711,
            telegram_username: "aman_s",
            first_name: "Aman",
            last_name: "Sharma",
            full_name: "Aman Sharma (Demo)",
            email: "aman@telegram.local",
            phone_number: "+91 98765 43210",
            phone_shared_at: new Date() as any,
            first_interaction: new Date() as any,
            last_interaction: new Date() as any,
            total_messages_sent: 8,
            total_conversations: 2,
            last_message_preview: "Where can I report Wi-Fi router issues?",
            status: "active",
          },
          {
            id: "demo-u-2" as any,
            telegram_id: 88776622,
            telegram_username: "priya_p",
            first_name: "Priya",
            last_name: "Patel",
            full_name: "Priya Patel (Demo)",
            email: "priya@telegram.local",
            phone_number: undefined,
            phone_shared_at: undefined,
            first_interaction: new Date() as any,
            last_interaction: new Date() as any,
            total_messages_sent: 14,
            total_conversations: 3,
            last_message_preview: "Water leakage in Room 304, Block C.",
            status: "active",
          },
          {
            id: "demo-u-3" as any,
            telegram_id: 77665533,
            telegram_username: "vikram_sethi",
            first_name: "Vikram",
            last_name: "Sethi",
            full_name: "Vikram Sethi (Demo)",
            email: "vikram@telegram.local",
            phone_number: "+91 91234 56789",
            phone_shared_at: new Date() as any,
            first_interaction: new Date() as any,
            last_interaction: new Date() as any,
            total_messages_sent: 5,
            total_conversations: 1,
            last_message_preview: "Thank you for fixing the study room lights!",
            status: "active",
          },
        ];
        setUsers(demoUsers);
        setTotal(demoUsers.length);
      }
    } catch (e) {
      console.error("Failed to load telegram users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, hasPhoneFilter, isAdmin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleExport = async () => {
    if (!requireAuth("Export student records to CSV")) return;
    try {
      setExporting(true);
      const blob = await exportTelegramUsersCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alona_telegram_students_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const openUserDrawer = async (user: TelegramUserItem) => {
    if (!requireAuth("Inspect private student profile & contact details")) return;
    setSelectedUser(user);
    setLoadingMessages(true);
    try {
      const msgs = await getTelegramUserMessages(user.id);
      setUserMessages(msgs);
    } catch (e) {
      console.error("Failed to load user messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            Telegram Student Directory
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Verified Telegram users interacting with @AIVA_LPU_bot ({total} total registered)
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? "Exporting..." : "Export Directory (CSV)"}</span>
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, @username, TG ID, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Contact Filter:</span>
          </div>

          <select
            value={hasPhoneFilter}
            onChange={(e) => {
              setHasPhoneFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="all">All Telegram Users</option>
            <option value="shared">📱 Phone Shared Only</option>
            <option value="none">No Phone Shared</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Student Profile</th>
                <th className="py-3.5 px-4">Telegram Handle & ID</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4">Last Message</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-mono text-cyan-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      Loading Telegram Students...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-mono text-slate-500">
                    No Telegram users matched your filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-900/40 transition-colors group"
                  >
                    {/* Student Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold shrink-0 font-mono">
                          {u.full_name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-200">
                            {u.full_name || "Telegram User"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Registered {new Date(u.first_interaction).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Telegram Username & ID */}
                    <td className="py-3.5 px-4 font-mono">
                      {u.telegram_username ? (
                        <div className="text-cyan-400">@{u.telegram_username}</div>
                      ) : (
                        <span className="text-slate-500">No handle</span>
                      )}
                      <div className="text-[10px] text-slate-500">
                        ID: {u.telegram_id || "N/A"}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3.5 px-4">
                      {u.phone_number ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                            <PhoneCall className="w-3 h-3" />
                            {u.phone_number}
                          </span>
                          {u.phone_shared_at && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Verified {new Date(u.phone_shared_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                          <XCircle className="w-3 h-3 text-slate-600" />
                          Not shared
                        </span>
                      )}
                    </td>

                    {/* Activity */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-300">
                        {u.total_messages_sent} msgs
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {u.total_conversations} threads
                      </div>
                    </td>

                    {/* Last Message Preview */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate text-slate-300 text-[11px]">
                        {u.last_message_preview || "No message preview"}
                      </p>
                      {u.last_interaction && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(u.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openUserDrawer(u)}
                        className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, total)} of {total} students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyan-500/40 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyan-500/40 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Message History Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-end">
          <div className="w-full max-w-lg h-full bg-[#0b0f19] border-l border-cyan-500/30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedUser.full_name}</span>
                  {selectedUser.telegram_username && (
                    <span className="text-xs font-mono text-cyan-400">
                      @{selectedUser.telegram_username}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Telegram ID: {selectedUser.telegram_id || "N/A"}
                </p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Banner */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500">Phone Status:</span>
                <div className="text-slate-200 mt-0.5 font-bold">
                  {selectedUser.phone_number ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" />
                      {selectedUser.phone_number}
                    </span>
                  ) : (
                    <span className="text-slate-500">Not shared</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Total Activity:</span>
                <div className="text-cyan-400 mt-0.5">
                  {selectedUser.total_messages_sent} msgs / {selectedUser.total_conversations} threads
                </div>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs font-mono text-cyan-400">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Fetching message history...
                  </div>
                </div>
              ) : userMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                  No messages recorded in database for this student.
                </div>
              ) : (
                userMessages.map((m) => {
                  const isUser = m.sender_type === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-1">
                        <span>{isUser ? "Student (Telegram)" : "AIVA Bot"}</span>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed ${
                          isUser
                            ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 rounded-tr-none"
                            : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none"
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
      )}
    </div>
  );
}
