"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, ApiError } from "@/lib/api";
import { signInWithGooglePopup } from "@/lib/firebase";
import AivaRobot3D from "@/components/3d/AivaRobot3D";
import { Shield, Lock, User, ArrowRight, AlertCircle, Bot, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      const { credential } = await signInWithGooglePopup();
      window.location.href = "/admin";
    } catch (err: any) {
      console.error("Firebase Google popup error:", err);
      const code = err?.code || "";
      if (code === "auth/configuration-not-found" || err?.message?.includes("CONFIGURATION_NOT_FOUND")) {
        setError("⚠️ Google Sign-In is not enabled in Firebase Console! Please go to Firebase Console ➔ Authentication ➔ Sign-in method ➔ Google ➔ click Enable and Save.");
      } else if (code === "auth/unauthorized-domain") {
        setError(`⚠️ Domain (${typeof window !== "undefined" ? window.location.hostname : "current"}) is not authorized. Please open http://localhost:3000 (not 127.0.0.1) or add it in Firebase ➔ Auth ➔ Settings ➔ Authorized domains.`);
      } else if (code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled: The Google popup window was closed before completing.");
      } else if (code === "auth/popup-blocked") {
        setError("Popup blocked: Please allow popups for localhost in your browser address bar.");
      } else {
        setError(err?.message || "Google Sign-in failed. Please verify Firebase project setup.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await adminLogin(identifier, password);
      router.push("/admin");
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many failed attempts. Security lock active. Please wait 15 minutes.");
      } else {
        setError(err.message || "Invalid administrator credentials. Access denied.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luminous-mesh text-slate-800 flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background ambient radial flares */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* 3D Robot Centerpiece */}
        <div className="flex flex-col items-center justify-center -mb-8">
          <AivaRobot3D width={280} height={210} />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-blue-700 text-xs font-bold tracking-wider shadow-sm -mt-6 z-20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            AIVA COMMAND CORE
          </div>
        </div>

        <div className="glass-card rounded-[32px] p-8 sm:p-9 shadow-[0_25px_60px_rgba(90,115,210,0.18)] mt-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Administrator Access
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              Authenticate to manage live Telegram bot & telemetry
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50/80 border border-red-300 text-red-700 text-xs flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@aiva.local"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-sm text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-blue-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-sm text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 btn-luminous-primary shadow-[0_10px_24px_rgba(37,99,235,0.4)] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Enter 3D Control Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white/80 px-3 py-0.5 rounded-full text-slate-500">
                Or authenticate with
              </span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-2xl glass-pill hover:bg-white text-xs font-bold text-slate-700 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Sign In with Google</span>
          </button>

          <div className="mt-6 pt-4 border-t border-white/60 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5 text-blue-700">
              <Shield className="w-3.5 h-3.5" />
              Bcrypt & Argon2 Protected
            </span>
            <span>v2.4 Neural Core</span>
          </div>
        </div>
      </div>
    </div>
  );
}
