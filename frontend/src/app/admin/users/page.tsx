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
      a.download = `aiva_telegram_students_${new Date().toISOString().split("T")[0]}.csv`;
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
              <Users className="w-5 h-5" />
            </div>
            Telegram Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Verified Telegram users interacting with @AIVA_LPU_bot ({total} total registered)
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="self-start sm:self-auto btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? "Exporting..." : "Export Directory (CSV)"}</span>
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-3xl glass-card flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, @username, TG ID, or phone..."
            className="w-full pl-10 pr-4 py-2.5 glass-input rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Contact Filter:</span>
          </div>

          <select
            value={hasPhoneFilter}
            onChange={(e) => {
              setHasPhoneFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 glass-card rounded-full text-xs font-medium text-slate-700 outline-none cursor-pointer shadow-sm"
          >
            <option value="all">All Telegram Users</option>
            <option value="shared">📱 Phone Shared Only</option>
            <option value="none">No Phone Shared</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-white/40 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-4 px-5">Student Profile</th>
                <th className="py-4 px-5">Telegram Handle & ID</th>
                <th className="py-4 px-5">Contact Phone</th>
                <th className="py-4 px-5">Activity</th>
                <th className="py-4 px-5">Last Message</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-semibold text-blue-600">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Loading Telegram Students...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-medium text-slate-500">
                    No Telegram users matched your filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    {/* Student Profile */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-[0_4px_12px_rgba(37,99,235,0.25)] flex items-center justify-center text-white font-bold shrink-0 text-xs">
                          {u.full_name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {u.full_name || "Telegram User"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Registered {new Date(u.first_interaction).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Telegram Username & ID */}
                    <td className="py-4 px-5 font-mono">
                      {u.telegram_username ? (
                        <div className="text-blue-600 font-semibold">@{u.telegram_username}</div>
                      ) : (
                        <span className="text-slate-400">No handle</span>
                      )}
                      <div className="text-[10px] text-slate-400">
                        ID: {u.telegram_id || "N/A"}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-4 px-5">
                      {u.phone_number ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 font-mono text-[11px] font-semibold">
                            <PhoneCall className="w-3 h-3" />
                            {u.phone_number}
                          </span>
                          {u.phone_shared_at && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              Verified {new Date(u.phone_shared_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <XCircle className="w-3.5 h-3.5 text-slate-300" />
                          Not shared
                        </span>
                      )}
                    </td>

                    {/* Activity */}
                    <td className="py-4 px-5">
                      <div className="text-slate-800 font-semibold">
                        {u.total_messages_sent} msgs
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {u.total_conversations} threads
                      </div>
                    </td>

                    {/* Last Message Preview */}
                    <td className="py-4 px-5 max-w-xs">
                      <p className="truncate text-slate-600 text-xs">
                        {u.last_message_preview || "No message preview"}
                      </p>
                      {u.last_interaction && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(u.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => openUserDrawer(u)}
                        className="px-3.5 py-1.5 rounded-full glass-card hover:bg-white text-xs font-semibold text-blue-600 shadow-sm transition-all cursor-pointer"
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
        <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-medium text-slate-500 bg-white/30">
          <div>
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, total)} of {total} students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-full glass-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white text-slate-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-full glass-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white text-slate-700 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Message History Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-end">
          <div className="w-full max-w-lg h-full glass-card rounded-l-3xl border-l border-white/90 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedUser.full_name}</span>
                  {selectedUser.telegram_username && (
                    <span className="text-xs font-semibold text-blue-600">
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
                className="p-2 rounded-full glass-card hover:bg-white text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Banner */}
            <div className="p-4 bg-white/50 border-b border-slate-200/60 grid grid-cols-2 gap-3 text-xs font-medium">
              <div>
                <span className="text-slate-400">Phone Status:</span>
                <div className="text-slate-800 mt-0.5 font-bold">
                  {selectedUser.phone_number ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" />
                      {selectedUser.phone_number}
                    </span>
                  ) : (
                    <span className="text-slate-400">Not shared</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Total Activity:</span>
                <div className="text-blue-600 mt-0.5 font-semibold">
                  {selectedUser.total_messages_sent} msgs / {selectedUser.total_conversations} threads
                </div>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3.5">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs font-semibold text-blue-600">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Fetching message history...
                  </div>
                </div>
              ) : userMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
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
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 mb-1">
                        <span>{isUser ? "Student (Telegram)" : "AIVA Bot"}</span>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
                            : "glass-card text-slate-800 rounded-tl-none border border-white/90"
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
