"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Check, CheckCheck, Phone, Video, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  isOutgoing: boolean;
}

interface WhatsAppSimulatorProps {
  recipientName: string;
  recipientPhone?: string;
  messages: { text: string; isOutgoing?: boolean }[];
  onClose: () => void;
}

export function WhatsAppSimulator({
  recipientName,
  recipientPhone,
  messages: initialMessages,
  onClose,
}: WhatsAppSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate messages being sent one by one
    setSending(true);
    let index = 0;

    const interval = setInterval(() => {
      if (index < initialMessages.length) {
        const msg = initialMessages[index];
        const now = new Date();
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${index}`,
            text: msg.text,
            timestamp: now.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "sent",
            isOutgoing: msg.isOutgoing !== false,
          },
        ]);

        // Simulate delivery after 500ms
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === `msg-${index}` ? { ...m, status: "delivered" } : m
            )
          );
        }, 500);

        // Simulate read after 1.5s
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === `msg-${index}` ? { ...m, status: "read" } : m
            )
          );
        }, 1500);

        index++;
      } else {
        clearInterval(interval);
        setSending(false);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initials = recipientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-zinc-900 flex flex-col" style={{ height: "600px" }}>
        {/* Header */}
        <div className="bg-[#075E54] dark:bg-[#1F2C33] text-white px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="hover:opacity-80">
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{recipientName}</p>
            <p className="text-xs opacity-80">
              {recipientPhone || "online"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Video className="w-5 h-5 opacity-80" />
            <Phone className="w-5 h-5 opacity-80" />
            <MoreVertical className="w-5 h-5 opacity-80" />
          </div>
        </div>

        {/* Chat Area */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d4d4' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: "#ECE5DD",
          }}
        >
          {/* Date badge */}
          <div className="flex justify-center mb-4">
            <span className="bg-white/90 dark:bg-zinc-800/90 text-xs text-zinc-500 px-3 py-1 rounded-lg shadow-sm">
              Today
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOutgoing ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                  msg.isOutgoing
                    ? "bg-[#DCF8C6] dark:bg-[#005C4B] text-zinc-800 dark:text-zinc-100"
                    : "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {msg.timestamp}
                  </span>
                  {msg.isOutgoing && (
                    <span className="text-zinc-500">
                      {msg.status === "read" ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                      ) : msg.status === "delivered" ? (
                        <CheckCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-end">
              <div className="bg-[#DCF8C6] dark:bg-[#005C4B] rounded-lg px-4 py-2 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#F0F0F0] dark:bg-[#1F2C33] px-3 py-2 flex items-center gap-2">
          <div className="flex-1 bg-white dark:bg-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-400">
            Type a message
          </div>
          <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
