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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Human Handover Queue
              {isGuest && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Guest Preview
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Staff intervention requests triggered by Telegram `/human` command or high-priority intents
            </p>
          </div>
        </div>

        <button
          onClick={loadHandovers}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {handovers.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 text-center max-w-md mx-auto space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto stroke-1" />
          <h3 className="font-bold text-white text-sm">No Pending Escalations</h3>
          <p className="text-xs text-slate-400 font-mono">
            All student queries are currently resolving autonomously with AI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
          {/* Handover List */}
          <div className="rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl p-3 space-y-2 overflow-y-auto">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider px-2 py-1">
              Pending Tickets ({handovers.length})
            </div>

            {handovers.map((hr) => {
              const isSelected = selectedHandover?.id === hr.id;
              return (
                <div
                  key={hr.id}
                  onClick={() => setSelectedHandover(hr)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                      : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                      {hr.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {formatRelativeTime(hr.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium line-clamp-2 mb-3">
                    {hr.reason || "Student requested staff assistance via Telegram"}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400">Thread #{String(hr.conversation_id).slice(0, 8)}</span>
                    {hr.status === "pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(hr);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold"
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
          <div className="lg:col-span-2 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl p-6 flex flex-col justify-between">
            {selectedHandover ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Escalation Case #{String(selectedHandover.id).slice(0, 8)}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Conversation ID: {selectedHandover.conversation_id}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase">
                    {selectedHandover.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-mono text-cyan-400 block font-bold">Escalation Trigger:</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {selectedHandover.reason}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 font-mono space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dispatch Platform:</span>
                    <span className="text-white">Telegram Gateway</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response Mode:</span>
                    <span className="text-amber-300">Direct Staff Takeover</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleClaim(selectedHandover)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
                  >
                    {isGuest ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>Take Over Conversation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                Select an escalation to inspect details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
