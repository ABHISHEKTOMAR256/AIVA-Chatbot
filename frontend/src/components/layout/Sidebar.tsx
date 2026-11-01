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
    <aside className="w-64 border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {studentLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {user?.role === "admin" && (
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">
              Staff & Admin
            </p>
            <nav className="space-y-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-amber-50 text-amber-800 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-amber-600" : "text-gray-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 text-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-900 font-semibold">
          <Send className="w-3.5 h-3.5 text-indigo-600" />
          <span>Telegram Integration</span>
        </div>
        <p className="text-gray-600 text-[11px] leading-relaxed">
          Access AIVA on your phone anytime via Telegram bot.
        </p>
        <a
          href={`https://t.me/${telegramBotUser}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full text-center py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Open @{telegramBotUser}
        </a>
      </div>
    </aside>
  );
}
