"use client";

import { useEffect, useState } from "react";
import { HandoverChat } from "@/components/admin/HandoverChat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getHandovers, claimHandover } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { UserCheck, Clock, CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import type { HandoverRequest } from "@/types";

export default function AdminHandoversPage() {
  const [handovers, setHandovers] = useState<HandoverRequest[]>([]);
  const [selectedHandover, setSelectedHandover] = useState<HandoverRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHandovers = async () => {
    try {
      setLoading(true);
      const data = await getHandovers();
      setHandovers(data);
      if (data.length > 0 && !selectedHandover) {
        setSelectedHandover(data[0]);
      }
    } catch (err) {
      console.error("Failed to load handovers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandovers();
  }, []);

  const handleClaim = async (hr: HandoverRequest) => {
    try {
      const updated = await claimHandover(hr.id);
      setSelectedHandover(updated);
      await loadHandovers();
    } catch (err: any) {
      alert("Failed to claim handover: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase tracking-wider mb-2">
          <Shield className="w-3 h-3 text-amber-600" />
          Human Handover Queue
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Escalated Student Conversations
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Respond directly to students when AI assistance requires hostel staff intervention.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : handovers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-gray-800 text-sm">No Pending Escalations</h3>
          <p className="text-xs text-gray-500 mt-1">
            All student requests are currently being handled smoothly by the AI assistant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
          {/* Handover List */}
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-y-auto">
            {handovers.map((hr) => {
              const isSelected = selectedHandover?.id === hr.id;
              return (
                <button
                  key={hr.id}
                  onClick={() => setSelectedHandover(hr)}
                  className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 ${
                    isSelected ? "bg-amber-50/70 border-l-4 border-amber-600" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">
                      {hr.user?.full_name || "Student"}
                    </span>
                    <Badge variant={hr.status === "pending" ? "warning" : "info"}>
                      {hr.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 font-medium line-clamp-1">{hr.reason}</p>
                  <span className="text-[10px] text-gray-400">
                    Escalated {formatRelativeTime(hr.created_at)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Handover Detail / Chat Area */}
          <div className="lg:col-span-2">
            {selectedHandover ? (
              selectedHandover.status === "pending" ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center flex flex-col items-center justify-center h-full">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Pending Claim: {selectedHandover.user?.full_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 max-w-sm">
                    Reason: "{selectedHandover.reason}". Claim this conversation to start chatting
                    directly with the student.
                  </p>
                  <Button
                    onClick={() => handleClaim(selectedHandover)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  >
                    <UserCheck className="w-4 h-4 mr-1.5" /> Claim Conversation
                  </Button>
                </div>
              ) : (
                <HandoverChat
                  handover={selectedHandover}
                  onResolved={() => {
                    setSelectedHandover(null);
                    loadHandovers();
                  }}
                />
              )
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center flex items-center justify-center h-full text-xs text-gray-400">
                Select a handover request from the list to view context and respond.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
