"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { MessageSquare, ArrowRight, Bot, Send } from "lucide-react";
import type { Conversation } from "@/types";

interface RecentConversationsProps {
  conversations: Conversation[];
}

export function RecentConversations({ conversations }: RecentConversationsProps) {
  if (conversations.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center border border-white/80 shadow-sm">
        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-600 font-semibold">No recent conversations</p>
        <p className="text-xs text-slate-400 mt-1">Start chatting with AIVA for hostel help.</p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-3 hover:underline"
        >
          Start Chat <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl divide-y divide-slate-100 overflow-hidden border border-white/80 shadow-sm">
      {conversations.slice(0, 5).map((conv) => (
        <Link
          key={conv.id}
          href={`/chat?id=${conv.id}`}
          className="p-4 flex items-center justify-between hover:bg-white/60 transition-colors block"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center flex-shrink-0">
              {conv.platform === "telegram" ? (
                <Send className="w-4 h-4 text-blue-600" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
                {conv.title || "Hostel Inquiry"}
              </p>
              <p className="text-[11px] text-slate-400 truncate font-medium">
                {conv.last_message || "No recent preview"}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 pl-3">
            <span className="text-[10px] text-slate-400 block font-medium">
              {formatRelativeTime(conv.updated_at || conv.created_at)}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 justify-end mt-0.5">
              Continue <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
