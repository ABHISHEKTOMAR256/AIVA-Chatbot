"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Bot,
  FileText,
  ShieldAlert,
  Image as ImageIcon,
  Clock,
  BarChart3,
  Activity,
  Settings,
  BookOpen,
  LogOut,
  Search,
  Bell,
  CheckCircle2,
  Lock,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { GuestAuthProvider, useGuestAuth } from "@/components/admin/GuestAuthContext";
import { getBotHealthStatus } from "@/lib/api";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const { isAdmin, isGuest, adminUser, openAuthModal, logout } = useGuestAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [botStatus, setBotStatus] = useState<any>({
    bot_online: true,
    bot_username: "AIVA_LPU_bot",
    database_status: "connected",
    database_latency_ms: 12,
  });

  useEffect(() => {
    if (isLoginPage) return;
    getBotHealthStatus()
      .then((health) => setBotStatus(health))
      .catch(() => {});
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // The core navigation sections for AIVA Chatbot Admin Dashboard
  const navItems = [
    { label: "Home", href: "/admin", icon: LayoutDashboard },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Chat History", href: "/admin/conversations", icon: MessageSquare },
    { label: "Chatbot Control", href: "/admin/control", icon: Bot },
    { label: "Operations", href: "/admin/operations", icon: FileText },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Handover", href: "/admin/handovers", icon: ShieldAlert },
    { label: "Media Gallery", href: "/admin/media", icon: ImageIcon },
    { label: "Knowledge RAG", href: "/admin/knowledge", icon: BookOpen },
    { label: "Sessions", href: "/admin/sessions", icon: Clock },
    { label: "System Health", href: "/admin/health", icon: Activity },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-luminous-mesh text-slate-800 p-2 sm:p-4 lg:p-6 flex flex-col md:flex-row gap-4 lg:gap-6 antialiased selection:bg-blue-500/20 selection:text-blue-900">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
            <span className="font-black text-sm tracking-tighter">A</span>
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            AIVA <span className="text-blue-600">CORE</span>
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl glass-pill text-slate-700"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Floating Skeuomorphic Frosted Glass Sidebar */}
      <aside
        className={`fixed md:sticky top-4 lg:top-6 z-40 h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] w-64 glass-card rounded-[32px] p-4 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top 3D Logo Mark */}
          <div className="px-3 pt-2 pb-5 flex items-center gap-3 border-b border-white/60">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-[0_10px_20px_rgba(59,130,246,0.35)] border border-white/60">
                <span className="font-black text-lg tracking-tighter">▲</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-slate-900 leading-none">
                AIVA
              </div>
              <div className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-1">
                AI Management Core
              </div>
            </div>
          </div>

          {/* Navigation Items (Scrollable Capsule List) */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-1.5 pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "btn-luminous-primary shadow-[0_8px_20px_rgba(37,99,235,0.38)]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60 glass-card-hover"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-white" : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom User Profile Capsule */}
          <div className="pt-3 border-t border-white/60 shrink-0">
            {isAdmin ? (
              <div className="p-3 rounded-2xl glass-card flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0 border border-white/70">
                    {(adminUser?.full_name?.[0] || adminUser?.email?.[0] || "A").toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {adminUser?.full_name || adminUser?.email?.split("@")[0] || "Administrator"}
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {adminUser?.role || "Super Admin"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl glass-card flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                    GP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Guest Visitor</div>
                    <div className="text-[10px] text-slate-500 font-medium">Preview Mode</div>
                  </div>
                </div>
                <Link
                  href={`/admin/login?redirect=${encodeURIComponent(pathname)}`}
                  className="px-3 py-1.5 rounded-xl btn-luminous-primary text-[10px] font-bold shadow-md"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col space-y-4 lg:space-y-6">
        {/* Top Floating Glass Header (Search + Status + Actions) */}
        <header className="glass-card rounded-[28px] p-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_12px_32px_rgba(90,115,210,0.08)]">
          {/* Frosted Floating Search Pill */}
          <div className="relative w-full sm:w-80 lg:w-96">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 rounded-full glass-input text-xs font-medium placeholder-slate-400"
            />
          </div>

          {/* Right Status Indicators & Quick Actions */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Telegram Bot Link Pill */}
            <a
              href={`https://t.me/${botStatus.bot_username || "AIVA_LPU_bot"}`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors shadow-sm"
            >
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>@{botStatus.bot_username || "AIVA_LPU_bot"}</span>
            </a>

            {/* Notification Bell Pill */}
            <div className="relative">
              <button
                onClick={() => {}}
                className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-sm"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
              </button>
            </div>

            {/* Online Status Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-emerald-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>Online</span>
            </div>

            {/* Profile Avatar Pill */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white">
              {(adminUser?.full_name?.[0] || adminUser?.email?.[0] || "A").toUpperCase()}
            </div>
          </div>
        </header>

        {/* Guest Mode Alert Banner */}
        {isGuest && (
          <div className="px-5 py-3 rounded-2xl glass-card border border-amber-300/60 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] tracking-wider uppercase shrink-0 shadow-sm">
                GUEST PREVIEW
              </span>
              <span>
                You are previewing AIVA with demonstration data. Authenticate to manage live Telegram bot & data.
              </span>
            </div>
            <button
              onClick={() => openAuthModal("Full Administrator Access")}
              className="self-start sm:self-auto px-4 py-1.5 rounded-xl btn-luminous-primary text-xs font-bold shrink-0 cursor-pointer"
            >
              Sign In to Unlock
            </button>
          </div>
        )}

        {/* Page Children Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </GuestAuthProvider>
  );
}
