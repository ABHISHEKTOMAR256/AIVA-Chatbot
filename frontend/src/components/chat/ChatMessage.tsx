"use client";

import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";
import { Bot, User as UserIcon, Shield, AlertTriangle } from "lucide-react";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isStaff = message.role === "staff";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 my-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
            <UserIcon className="w-4 h-4" />
          </div>
        ) : isStaff ? (
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">
            <Shield className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">
            <Bot className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-gray-700">
            {isUser ? "You" : isStaff ? "Hostel Staff" : "AIVA Assistant"}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatRelativeTime(message.created_at)}
          </span>
        </div>

        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
              : isStaff
              ? "bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-tl-none"
              : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none"
          }`}
        >
          {message.content}
        </div>

        {message.media_url && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 max-w-xs">
            <img
              src={message.media_url}
              alt="Message attachment"
              className="w-full h-auto object-cover max-h-60"
            />
          </div>
        )}
      </div>
    </div>
  );
}
