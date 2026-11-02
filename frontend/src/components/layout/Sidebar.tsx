"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  AlertCircle,
  Search,
  Shield,
  HelpCircle,
  FileText,
  UserCheck,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "AI Helpdesk Chat", icon: MessageSquare },
    { href: "/complaints", label: "Complaints", icon: AlertCircle },
    { href: "/lost-found", label: "Lost & Found", icon: Search },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview & Analytics", icon: Shield },
    { href: "/admin/complaints", label: "Manage Complaints", icon: AlertCircle },
    { href: "/admin/handovers", label: "Human Handover", icon: UserCheck },
    { href: "/admin/knowledge", label: "Knowledge Base", icon: FileText },
  ];

  const telegramBotUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "aiva_hostel_bot";

  return (
    <aside className="w-64 glass-card rounded-3xl min-h-[calc(100vh-8rem)] flex flex-col justify-between p-5 border border-white/80 shadow-sm shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Main Menu
          </p>
          <nav className="space-y-1.5">
            {studentLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {user?.role === "admin" && (
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-3">
              Staff &amp; Admin
            </p>
            <nav className="space-y-1.5">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/60 rounded-2xl border border-white/80 text-xs space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Send className="w-3.5 h-3.5 text-blue-600" />
          <span>Telegram Integration</span>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
          Access AIVA on your phone anytime via Telegram bot.
        </p>
        <a
          href={`https://t.me/${telegramBotUser}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-luminous-primary inline-block w-full text-center py-2 px-3 rounded-full text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          Open @{telegramBotUser}
        </a>
      </div>
    </aside>
  );
}
