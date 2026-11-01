"use client";

import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { Plus, MessageSquare, Bot, Send } from "lucide-react";
import type { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  return (
    <div className="w-72 border-r border-gray-200 bg-white flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <Button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium py-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {conversations.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-1" />
            No conversations yet. Start a new chat!
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1 ${
                  isActive
                    ? "bg-indigo-50 border-l-4 border-indigo-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {c.platform === "telegram" ? (
                      <Send className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {c.title || "Hostel Inquiry"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {formatRelativeTime(c.updated_at || c.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="truncate pr-2">
                    {c.last_message || "No messages"}
                  </span>
                  {c.status === "handed_over" && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                      Staff
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
