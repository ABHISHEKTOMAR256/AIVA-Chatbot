"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signOutFirebase } from "@/lib/firebase";
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
    try {
      await signOutFirebase();
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    document.cookie = "aiva_auth_session=; path=/; max-age=0; SameSite=Lax";
    router.push("/");
    router.refresh();
  };

  return (
    <header className="h-16 glass-card rounded-full sticky top-4 z-30 flex items-center justify-between px-6 shadow-sm border border-white/80">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
            <Bot className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent font-extrabold">
            AIVA
          </span>
        </Link>
        <span className="hidden md:inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200/60 px-3 py-1 rounded-full font-semibold">
          Hostel Helpdesk
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user?.role === "admin" && (
          <Link href="/admin">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </span>
          </Link>
        )}

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {user.full_name || user.email.split("@")[0]}
              </span>
              <span className="text-[10px] text-slate-400 capitalize font-medium">{user.role}</span>
            </div>
            <Avatar
              src={user.avatar_url}
              name={user.full_name || user.email}
              size="md"
            />
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full glass-card hover:bg-white text-slate-400 hover:text-rose-600 transition-all cursor-pointer shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
