"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import {
  getConversations,
  getConversation,
  sendMessage,
  createConversation,
  requestHandover,
} from "@/lib/api";
import { Bot, UserCheck, Sparkles, MessageSquare } from "lucide-react";
import type { Conversation, Message } from "@/types";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams?.get("id");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation list
  useEffect(() => {
    async function loadConversations() {
      try {
        const list = await getConversations();
        setConversations(list);
        if (list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoadingList(false);
      }
    }
    loadConversations();
  }, []);

  // Load active conversation messages
  useEffect(() => {
    if (!activeConvId) return;

    async function loadMessages() {
      try {
        setLoadingChat(true);
        const data = await getConversation(activeConvId!);
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to load conversation messages:", err);
      } finally {
        setLoadingChat(false);
      }
    }

    loadMessages();
  }, [activeConvId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleNewChat = async () => {
    try {
      const newConv = await createConversation("New Conversation");
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create new conversation:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (sending) return;

    const tempUserMsg: Message = {
      id: "temp-" + Date.now(),
      conversation_id: activeConvId || "",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const result = await sendMessage(text, activeConvId || undefined);

      if (!activeConvId && result.conversation_id) {
        setActiveConvId(result.conversation_id);
      }

      const aiMsg: Message = {
        id: result.message_id || "ai-" + Date.now(),
        conversation_id: result.conversation_id,
        role: "assistant",
        content: result.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      const updatedList = await getConversations();
      setConversations(updatedList);
    } catch (err: any) {
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        conversation_id: activeConvId || "",
        role: "system",
        content: `Error generating response: ${err?.message || "Ollama server connection error. Please try again."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleHandover = async () => {
    if (!activeConvId) return;
    const reason = prompt("Please provide a brief reason for requesting staff assistance:");
    if (!reason) return;

    try {
      await requestHandover(activeConvId, reason);
      const sysMsg: Message = {
        id: "handover-" + Date.now(),
        conversation_id: activeConvId,
        role: "system",
        content: "A human staff member has been notified and will reply here shortly.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    } catch (err: any) {
      alert("Failed to request human help: " + err.message);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="h-[calc(100vh-7rem)] glass-card rounded-3xl border border-white/80 overflow-hidden flex shadow-sm">
      <ConversationList
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => setActiveConvId(id)}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col h-full bg-white/30 backdrop-blur-md">
        <div className="h-16 border-b border-white/80 bg-white/40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 leading-tight">
                {activeConv?.title || "AIVA Virtual Assistant"}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                {activeConv?.status === "handed_over"
                  ? "Connected with Staff"
                  : "AI Mode (Ollama + RAG)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleHandover}
              className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/70 text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Request Staff Help</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loadingChat ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                How can AIVA help you today?
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                Ask about hostel gate hours, file a Wi-Fi or electricity complaint,
                or check mess timings.
              </p>

              <div className="grid grid-cols-1 gap-2.5 w-full text-xs">
                {[
                  "What are the hostel gate timings?",
                  "My room Wi-Fi is not connecting",
                  "How do I report a leaking tap?",
                  "Where is the laundry room located?",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleSendMessage(promptText)}
                    className="p-3 rounded-2xl glass-card hover:bg-white text-slate-700 text-left transition-all font-medium border border-white/80 shadow-sm cursor-pointer"
                  >
                    &ldquo;{promptText}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {sending && (
                <div className="flex gap-3 my-4">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                    <span className="ml-2 text-gray-400">AIVA is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          onRequestHandover={handleHandover}
          isLoading={sending}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-white rounded-2xl border border-gray-200">
          <Spinner size="lg" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
