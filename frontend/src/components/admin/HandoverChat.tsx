"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle2, Bot } from "lucide-react";
import { replyHandover, resolveHandover } from "@/lib/api";
import type { HandoverRequest } from "@/types";

interface HandoverChatProps {
  handover: HandoverRequest;
  onResolved: () => void;
}

export function HandoverChat({ handover, onResolved }: HandoverChatProps) {
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    try {
      setIsSending(true);
      await replyHandover(handover.id, replyText.trim());
      setReplyText("");
    } catch (err: any) {
      alert("Failed to send reply: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm("Resolve this handover and return conversation control to the AI assistant?")) {
      return;
    }
    try {
      setIsResolving(true);
      await resolveHandover(handover.id);
      onResolved();
    } catch (err: any) {
      alert("Failed to resolve handover: " + err.message);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between h-full">
      <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Escalation from {handover.user?.full_name || "Student"}
          </h3>
          <p className="text-xs text-gray-500">
            Reason: <span className="text-gray-800 font-medium">{handover.reason}</span>
          </p>
        </div>
        <Button
          onClick={handleResolve}
          disabled={isResolving}
          variant="outline"
          size="sm"
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
          Resolve & Return to AI
        </Button>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-200 text-xs text-gray-700 leading-relaxed max-h-48 overflow-y-auto">
        <p className="font-semibold text-gray-900 mb-1">Conversation Context:</p>
        <p className="italic text-gray-600">
          {handover.conversation_snippet || "User requested human help directly."}
        </p>
      </div>

      <form onSubmit={handleSendReply} className="flex gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type staff reply to student..."
          disabled={isSending}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
        <Button
          type="submit"
          disabled={!replyText.trim() || isSending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
