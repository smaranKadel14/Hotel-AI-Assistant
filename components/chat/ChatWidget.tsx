"use client";

import React, { useEffect, useRef, useState } from "react";

export type ChatMessageItem = {
  id: string;
  sender: "GUEST" | "AI";
  text: string;
  createdAt: Date;
};

interface ChatWidgetProps {
  hotelSlug?: string;
  hotelName?: string;
  initialWelcomeMessage?: string;
}

export function ChatWidget({
  hotelSlug = "himalayan-grand-hotel",
  hotelName = "Himalayan Grand Hotel",
  initialWelcomeMessage = `Hello! Welcome to ${hotelName}. How can I assist you with rooms, amenities, or services today?`,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "welcome-msg",
      sender: "AI",
      text: initialWelcomeMessage,
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = input.trim();
    if (!trimmedMessage || isLoading) return;

    const guestMessageId = `guest-${Date.now()}`;
    const newGuestMessage: ChatMessageItem = {
      id: guestMessageId,
      sender: "GUEST",
      text: trimmedMessage,
      createdAt: new Date(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newGuestMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const payload: {
        hotelSlug: string;
        message: string;
        conversationId?: string;
      } = {
        hotelSlug,
        message: trimmedMessage,
      };

      if (conversationId) {
        payload.conversationId = conversationId;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error with status ${response.status}`);
      }

      const data = (await response.json()) as {
        conversationId: string;
        reply: string;
        handoffSuggested?: boolean;
      };

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const aiMessage: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        sender: "AI",
        text: data.reply || "I am currently unable to process your request. Please try again.",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("ChatWidget request failed:", err);
      const errorMessage: ChatMessageItem = {
        id: `err-${Date.now()}`,
        sender: "AI",
        text: "Sorry, I am having trouble connecting right now. Please contact the front desk directly or try again later.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-3 flex h-130 w-90 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all sm:w-100">
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3.5 text-white">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold shadow-inner">
                🏨
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">{hotelName}</h3>
                <p className="text-xs text-slate-300">AI Concierge • Online</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
            {messages.map((msg) => {
              const isGuest = msg.sender === "GUEST";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isGuest ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                      isGuest
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start">
                <div className="flex items-center space-x-1.5 rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center border-t border-slate-200 bg-white p-3 space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about our hotel..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Launcher Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-label={isOpen ? "Close chat widget" : "Open chat widget"}
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
