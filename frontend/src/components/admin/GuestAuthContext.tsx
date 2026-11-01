"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Lock, ArrowRight, X, Sparkles, CheckCircle2 } from "lucide-react";
import { getAdminMe } from "@/lib/api";

interface GuestAuthContextType {
  isAdmin: boolean;
  isGuest: boolean;
  adminUser: any | null;
  loading: boolean;
  requireAuth: (actionName?: string) => boolean;
  openAuthModal: (actionName?: string) => void;
  closeAuthModal: () => void;
  logout: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextType>({
  isAdmin: false,
  isGuest: true,
  adminUser: null,
  loading: true,
  requireAuth: () => false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  logout: () => {},
});

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attemptedAction, setAttemptedAction] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      if (typeof window === "undefined") return;

      // 1. Check local storage token or cookie
      const token = localStorage.getItem("aiva_admin_token");
      const storedUser = localStorage.getItem("aiva_admin_user");

      if (token && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setIsAdmin(true);
          setAdminUser(parsed);
          setLoading(false);
          return;
        } catch {}
      }

      // 2. Query /admin/me to check cookie-based auth
      try {
        const me = await getAdminMe();
        if (me && me.role) {
          setIsAdmin(true);
          setAdminUser(me);
          localStorage.setItem("aiva_admin_user", JSON.stringify(me));
        } else {
          setIsAdmin(false);
          setAdminUser(null);
        }
      } catch {
        setIsAdmin(false);
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname]);

  const requireAuth = (actionName?: string): boolean => {
    if (isAdmin) return true;
    setAttemptedAction(actionName || "this feature");
    setIsModalOpen(true);
    return false;
  };

  const openAuthModal = (actionName?: string) => {
    setAttemptedAction(actionName || "administrative actions");
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setAttemptedAction(null);
  };

  const handleSignInRedirect = () => {
    closeAuthModal();
    const dest = pathname || "/admin";
    router.push(`/admin/login?redirect=${encodeURIComponent(dest)}`);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aiva_admin_token");
      localStorage.removeItem("aiva_admin_user");
      document.cookie = "aiva_admin_token=; path=/; max-age=0; SameSite=Lax";
    }
    setIsAdmin(false);
    setAdminUser(null);
    router.push("/admin");
    router.refresh();
  };

  return (
    <GuestAuthContext.Provider
      value={{
        isAdmin,
        isGuest: !isAdmin,
        adminUser,
        loading,
        requireAuth,
        openAuthModal,
        closeAuthModal,
        logout,
      }}
    >
      {children}

      {/* Guest Authentication Interceptor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-cyan-500/30 rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,240,255,0.15)] text-slate-100">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold block">
                  Security Access Control
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Sign in to access this feature
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Authenticate to manage conversations, view private records, and perform administrative actions.
            </p>

            {attemptedAction && (
              <div className="mb-5 px-3 py-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Action requested: <strong className="text-white">{attemptedAction}</strong></span>
              </div>
            )}

            <div className="space-y-2.5 text-xs text-slate-400 mb-6 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Interactive preview is available without credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Live records, phone numbers & Telegram replies require sign-in</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleSignInRedirect}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
              >
                <Shield className="w-4 h-4" />
                Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={closeAuthModal}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 font-medium text-sm transition-colors"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </GuestAuthContext.Provider>
  );
}

export const useGuestAuth = () => useContext(GuestAuthContext);
