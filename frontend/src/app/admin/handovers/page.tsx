"use client";

import React, { useEffect, useState } from "react";
import { HandoverChat } from "@/components/admin/HandoverChat";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import { getHandovers, claimHandover } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import {
  UserCheck,
  Clock,
  CheckCircle2,
  Shield,
  AlertTriangle,
  Lock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { HandoverRequest } from "@/types";

export default function AdminHandoversPage() {
  const { isAdmin, isGuest, requireAuth } = useGuestAuth();

  const [handovers, setHandovers] = useState<HandoverRequest[]>([]);
  const [selectedHandover, setSelectedHandover] = useState<HandoverRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHandovers = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const data = await getHandovers();
        setHandovers(data);
        if (data.length > 0 && !selectedHandover) {
          setSelectedHandover(data[0]);
        }
      } else {
        // Guest Demo Handover Queue
        const demoHandovers: any[] = [
          {
            id: "demo-ho-1",
            conversation_id: "demo-conv-2",
            user_id: "demo-u-2",
            reason: "Triggered via Telegram /human: Water pipe burst in Room 304",
            status: "pending",
            created_at: new Date(Date.now() - 900000).toISOString(),
          },
          {
            id: "demo-ho-2",
            conversation_id: "demo-conv-3",
            user_id: "demo-u-3",
            reason: "Student requested warden review regarding gate pass curfew extension",
            status: "pending",
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ];
        setHandovers(demoHandovers);
        if (!selectedHandover) setSelectedHandover(demoHandovers[0]);
      }
    } catch (err) {
      console.error("Failed to load handovers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandovers();
  }, [isAdmin]);

  const handleClaim = async (hr: HandoverRequest) => {
    if (!requireAuth("Claim and take over conversation")) return;

    try {
      const updated = await claimHandover(hr.id);
      setSelectedHandover(updated);
      await loadHandovers();
    } catch (err: any) {
      alert("Failed to claim handover: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(245,158,11,0.35)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Human Handover Queue
              {isGuest && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 font-medium">
                  Guest Preview
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Staff intervention requests triggered by Telegram `/human` command or high-priority intents
            </p>
          </div>
        </div>

        <button
          onClick={loadHandovers}
          className="px-4 py-2 rounded-full glass-card hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {handovers.length === 0 ? (
        <div className="p-12 rounded-3xl glass-card text-center max-w-md mx-auto space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto stroke-1" />
          <h3 className="font-bold text-slate-900 text-base">No Pending Escalations</h3>
          <p className="text-xs text-slate-500 font-medium">
            All student queries are currently resolving autonomously with AI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
          {/* Handover List */}
          <div className="rounded-3xl glass-card p-4 space-y-3 overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Pending Tickets ({handovers.length})
            </div>

            {handovers.map((hr) => {
              const isSelected = selectedHandover?.id === hr.id;
              return (
                <div
                  key={hr.id}
                  onClick={() => setSelectedHandover(hr)}
                  className={`p-5 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/90 border border-blue-400/80 shadow-[0_8px_20px_rgba(37,99,235,0.15)] ring-2 ring-blue-500/20"
                      : "glass-card hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 uppercase">
                      {hr.status}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatRelativeTime(hr.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-semibold line-clamp-2 mb-3">
                    {hr.reason || "Student requested staff assistance via Telegram"}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600 font-mono font-medium">Thread #{String(hr.conversation_id).slice(0, 8)}</span>
                    {hr.status === "pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(hr);
                        }}
                        className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        {isGuest ? "Claim" : "Claim Request"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Handover Detail View */}
          <div className="lg:col-span-2 rounded-3xl glass-card p-7 flex flex-col justify-between">
            {selectedHandover ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-5 border-b border-slate-200/70">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Escalation Case #{String(selectedHandover.id).slice(0, 8)}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Conversation ID: {selectedHandover.conversation_id}
                    </p>
                  </div>

                  <span className="px-3.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold uppercase">
                    {selectedHandover.status}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white/60 border border-white/80 space-y-2">
                  <span className="text-xs font-bold text-blue-600 block">Escalation Trigger:</span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {selectedHandover.reason}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/40 border border-white/80 text-xs text-slate-600 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dispatch Platform:</span>
                    <span className="text-slate-900 font-semibold">Telegram Gateway</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response Mode:</span>
                    <span className="text-amber-700 font-semibold">Direct Staff Takeover</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleClaim(selectedHandover)}
                    className="btn-luminous-primary px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {isGuest ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>Take Over Conversation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
                Select an escalation to inspect details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
