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
  Menu,
  X,
  ExternalLink,
  Shield,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import { GuestAuthProvider, useGuestAuth } from "@/components/admin/GuestAuthContext";
import { getBotHealthStatus } from "@/lib/api";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const { isAdmin, isGuest, adminUser, openAuthModal, logout } = useGuestAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // The 12 core navigation sections for AIVA Chatbot Admin Dashboard
  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Conversations", href: "/admin/conversations", icon: MessageSquare },
    { label: "Chatbot Control", href: "/admin/control", icon: Bot },
    { label: "Manual Operations", href: "/admin/operations", icon: FileText },
    { label: "Human Handover", href: "/admin/handovers", icon: ShieldAlert },
    { label: "Media Gallery", href: "/admin/media", icon: ImageIcon },
    { label: "Knowledge & RAG", href: "/admin/knowledge", icon: BookOpen },
    { label: "Sessions", href: "/admin/sessions", icon: Clock },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "System Health", href: "/admin/health", icon: Activity },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row antialiased font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0b0f19] border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-white font-mono text-sm">
            AIVA <span className="text-cyan-400">CONTROL</span>
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Futuristic Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-[#070b14]/95 md:bg-[#070b14]/80 backdrop-blur-2xl border-r border-cyan-500/20 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070b14]" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-sm text-white font-mono flex items-center gap-1.5">
                AIVA 3D CORE
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {isAdmin ? "ADMIN" : "GUEST"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Chatbot Control Center
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-cyan-400" : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Operating Mode Badge */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 shrink-0">
          {/* Bot Connection Quick Pill */}
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">@{botStatus.bot_username || "AIVA_LPU_bot"}</span>
            </div>
            <a
              href={`https://t.me/${botStatus.bot_username || "AIVA_LPU_bot"}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mode Switcher / User Profile */}
          {isAdmin ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {(adminUser?.email?.[0] || "A").toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {adminUser?.full_name || adminUser?.email || "Super Admin"}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono capitalize">
                    {adminUser?.role || "Administrator"}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg bg-slate-900/80 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] text-cyan-300 font-mono font-medium">Guest Mode</span>
              </div>
              <Link
                href={`/admin/login?redirect=${encodeURIComponent(pathname)}`}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-[10px] tracking-wide"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Top Telemetry Header & Guest Alert Banner */}
        <header className="sticky top-0 z-30 bg-[#070b14]/90 backdrop-blur-xl border-b border-slate-800/80 flex flex-col">
          {/* Guest Mode Banner when not logged in */}
          {isGuest && (
            <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-violet-500/15 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold tracking-wider uppercase shrink-0">
                  Guest Preview
                </span>
                <span>
                  You are previewing AIVA Chatbot Control Center with demonstration data. Real administrative actions require authentication.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal("Unlock Full Admin Access")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-[11px] font-semibold transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  <span>Authenticate</span>
                </button>
              </div>
            </div>
          )}

          <div className="h-14 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-500">Status:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Telegram Polling Online
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[11px]">
                DB Latency: {botStatus.database_latency_ms || 14}ms
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/conversations"
                className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition-all"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Live Feed</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </main>
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
