"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signInWithGooglePopup } from "@/lib/firebase";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [signingIn, setSigningIn] = useState(false);
  const telegramBotUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "AIVA_LPU_bot";

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGooglePopup();
      router.push("/dashboard");
    } catch (err: any) {
      console.warn("Firebase sign-in popup closed or error:", err);
      try {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      } catch (oauthErr: any) {
        alert("Google Sign-In failed: " + (err?.message || "Please check configuration"));
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent block leading-tight">
              AIVA
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-wide block uppercase">
              Hostel Virtual Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://t.me/${telegramBotUser}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Telegram Bot
          </a>

          <Button
            onClick={handleGoogleSignIn}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold px-4 py-2 shadow-sm"
          >
            Sign In with Google
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          Powered by Local Ollama AI & PostgreSQL
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight sm:leading-none mb-6">
          Smarter Hostel Living with{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            AIVA Helpdesk
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Instantly register complaints, ask hostel rules, report lost items, and
          connect with wardens — anytime on Web and Telegram.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={handleGoogleSignIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold text-sm shadow-sm hover:shadow transition-all"
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            Chat on Telegram
          </a>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">AI Assistant</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Trained on hostel rules, FAQs, and mess schedules for fast answers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Complaint Tracking</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Unique tracking IDs, real-time technician updates, and status alerts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Lost & Found</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Report lost items with privacy-protected verification before claim.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Human Handover</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Seamlessly escalate complex issues to hostel wardens with 1-click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 AIVA — Artificial Intelligence Virtual Assistant.</p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-gray-900">
              Student Dashboard
            </Link>
            <Link href="/admin" className="hover:text-gray-900">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
