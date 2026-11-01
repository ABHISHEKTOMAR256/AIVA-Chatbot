"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LogOut, Bot, Shield, Bell } from "lucide-react";
import type { User } from "@/types";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            AIVA
          </span>
        </Link>
        <span className="hidden md:inline-block text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
          Hostel Helpdesk
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user?.role === "admin" && (
          <Link href="/admin">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </span>
          </Link>
        )}

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {user.full_name || user.email.split("@")[0]}
              </span>
              <span className="text-xs text-gray-500 capitalize">{user.role}</span>
            </div>
            <Avatar
              src={user.avatar_url}
              name={user.full_name || user.email}
              size="md"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-500 hover:text-red-600 p-2"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
