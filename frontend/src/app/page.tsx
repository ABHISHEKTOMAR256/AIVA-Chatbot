"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signInWithGooglePopup } from "@/lib/firebase";
import { adminLogin, ApiError } from "@/lib/api";
import {
  Bot,
  MessageSquare,
  AlertCircle,
  Search,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  Send,
  Lock,
  X,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const telegramBotUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "AIVA_LPU_bot";

  // Admin login modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminIdentifier, setAdminIdentifier] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);
    try {
      await adminLogin(adminIdentifier, adminPassword);
      window.location.href = "/admin";
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setAdminError("Too many attempts. Rate limit active (please wait 15 minutes).");
      } else if (
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.status === 503
      ) {
        setAdminError(
          "Backend server is offline (http://localhost:8000). Click 'Auto-Fill' above to authenticate in Demo Admin Mode, or start the backend."
        );
      } else {
        setAdminError(err.message || "Invalid administrator credentials. Access denied.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setAdminIdentifier("admin@aiva.local");
    setAdminPassword("Admin@AIVA2026");
    setAdminError(null);
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGooglePopup();
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Firebase sign-in error:", err);
      const code = err?.code || "";
      if (code === "auth/configuration-not-found" || err?.message?.includes("CONFIGURATION_NOT_FOUND")) {
        setAuthError(
          "⚠️ Google Sign-In is not enabled in Firebase Console! Go to Firebase Console ➔ Authentication ➔ Sign-in method ➔ Google ➔ click Enable and Save."
        );
      } else if (code === "auth/unauthorized-domain") {
        setAuthError(
          `⚠️ Domain (${typeof window !== "undefined" ? window.location.hostname : "this domain"}) is not authorized. Open http://localhost:3000 or add it in Firebase ➔ Auth ➔ Settings ➔ Authorized domains.`
        );
      } else if (code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in cancelled: The Google popup window was closed before completing.");
      } else if (code === "auth/popup-blocked") {
        setAuthError("Popup blocked: Please allow popups for localhost in your browser address bar.");
      } else {
        setAuthError(err?.message || "Google Sign-in error. Please verify Firebase project setup.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-luminous-mesh flex flex-col justify-between text-slate-900">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
        <header className="glass-card rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent block leading-tight">
                AIVA
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider block uppercase">
                AI Telegram &amp; Hostel Core
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setShowAdminModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 sm:px-4 py-2 rounded-full glass-card hover:bg-white text-slate-800 shadow-sm transition-all cursor-pointer border border-blue-200/80 hover:border-blue-400"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Login</span>
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-full glass-card hover:bg-white text-blue-600 shadow-sm transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">3D Control Center</span>
              <span className="sm:hidden">Preview</span>
            </Link>

            <a
              href={`https://t.me/${telegramBotUser}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full glass-card hover:bg-white text-blue-700 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Telegram Bot</span>
            </a>

            <button
              onClick={handleGoogleSignIn}
              className="btn-luminous-primary rounded-full text-xs font-semibold px-4 sm:px-5 py-2 cursor-pointer shadow-md"
            >
              Sign In with Google
            </button>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        {authError && (
          <div className="mb-8 p-4 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 text-left shadow-sm">
            <span>{authError}</span>
            <button
              onClick={() => setAuthError(null)}
              className="text-amber-700 hover:text-amber-900 font-bold px-3 py-1 text-xs rounded-full hover:bg-amber-200/50"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-blue-700 text-xs font-semibold mb-6 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-cyan-500" />
          <span>Powered by Local Ollama AI &amp; Supabase pgvector</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none mb-6">
          Smarter Hostel Living with{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            AIVA Core
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Instantly register complaints, ask hostel rules, report lost items, and
          connect with wardens — anytime on Web and Telegram.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={handleGoogleSignIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full glass-card hover:bg-white text-slate-800 font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <a
            href={`https://t.me/${telegramBotUser}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full btn-luminous-primary text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Chat on Telegram
          </a>

          <button
            onClick={() => setShowAdminModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full glass-card hover:bg-white text-slate-900 font-bold text-sm shadow-md transition-all cursor-pointer border border-blue-300/80 hover:border-blue-500 hover:scale-[1.02]"
          >
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Admin Login</span>
          </button>

          <Link
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full glass-card hover:bg-white text-blue-600 font-semibold text-sm shadow-md transition-all"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span>3D Admin Center (Guest Mode)</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="p-6 rounded-3xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">AI Assistant</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Trained on hostel rules, FAQs, and mess schedules for fast answers.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Complaint Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Unique tracking IDs, real-time technician updates, and status alerts.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Lost &amp; Found</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Report lost items with privacy-protected verification before claim.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Human Handover</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Seamlessly escalate complex issues to hostel wardens with 1-click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/60 py-6 backdrop-blur-md bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p>© 2026 AIVA — Artificial Intelligence Virtual Assistant.</p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Student Dashboard
            </Link>
            <Link href="/admin" className="hover:text-slate-900 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-[32px] glass-card bg-white/95 text-slate-800 shadow-[0_25px_60px_rgba(90,115,210,0.25)] border border-white/70">
            {/* Close Button */}
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Sign In</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Access AIVA 3D Control Center &amp; Live Management
              </p>
            </div>

            {/* Demo Quick Fill Banner */}
            <div className="mb-4 p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between gap-2">
              <div className="text-left">
                <span className="text-[11px] font-bold text-blue-900 block">Quick Demo Credentials</span>
                <span className="text-[10px] text-blue-600 font-medium">admin@aiva.local • Admin@AIVA2026</span>
              </div>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Auto-Fill</span>
              </button>
            </div>

            {adminError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shadow-sm text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{adminError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={adminIdentifier}
                  onChange={(e) => setAdminIdentifier(e.target.value)}
                  placeholder="admin@aiva.local"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="btn-luminous-primary w-full py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 mt-2"
              >
                {adminLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Admin Portal</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link
                href="/admin/login"
                className="hover:text-blue-600 font-medium transition-colors"
              >
                Full Login Page →
              </Link>
              <Link
                href="/admin"
                className="hover:text-indigo-600 font-medium transition-colors"
              >
                Guest Preview →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
