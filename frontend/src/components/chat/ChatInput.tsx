"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Send, Paperclip, Loader2, UserCheck } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onRequestHandover?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onRequestHandover,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-gray-400">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-[10px]">Shift+Enter</kbd> for new line
        </span>
        {onRequestHandover && (
          <button
            type="button"
            onClick={onRequestHandover}
            className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Request Human Help
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative bg-gray-50 rounded-xl border border-gray-300 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              disabled
                ? "Conversation is in staff mode or closed..."
                : "Ask about hostel rules, mess timings, or file a complaint..."
            }
            className="w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none placeholder-gray-400 text-gray-900 disabled:opacity-50"
          />
        </div>

        <Button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          className="rounded-xl h-[46px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
