"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";
import { BotChatMessage } from "@/lib/bot/types";

export const BotChatDrawer: React.FC = () => {
  const { isBotChatOpen, closeBotChat, addEvent, events, openIntegrations } = useCalendar();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<BotChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "Hello Alex! I am your Caspian AI Calendar Assistant powered by GPT-OSS-120b. You can ask me to schedule events, check your availability, or query your calendar details.",
      timestamp: "Just now",
      channel: "telegram",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isBotChatOpen) {
      scrollToBottom();
    }
  }, [messages, isBotChatOpen]);

  if (!isBotChatOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const userMsg: BotChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          clientEvents: events,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const assistantMsg: BotChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          toolCalls: data.toolCalls,
          executedAction: data.executedAction,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // If an event was created by the bot, sync it directly into CalendarContext
        if (data.newEvent) {
          addEvent({
            dateStr: data.newEvent.dateStr,
            start: data.newEvent.start,
            dur: data.newEvent.dur,
            title: data.newEvent.title,
            cat: data.newEvent.cat,
            time: data.newEvent.time,
            meta: data.newEvent.meta,
            attendees: data.newEvent.attendees,
          });
          showToast(`📅 Caspian Bot added "${data.newEvent.title}" to calendar!`);
        }
      } else {
        showToast(data.error || "Failed to contact bot server");
      }
    } catch {
      showToast("Error communicating with AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "Schedule Q3 Review tomorrow at 3pm",
    "What's on my schedule for today?",
    "Find free time slots on Friday",
    "Add lunch with Sarah on Nov 21 at 1pm",
  ];

  return (
    <div className="modal-overlay" style={{ justifyContent: "flex-end" }} onClick={closeBotChat}>
      <div
        className="modal-content fade-up"
        style={{
          width: "420px",
          height: "100vh",
          maxHeight: "100vh",
          borderRadius: "0",
          margin: "0",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          borderLeft: "1px solid var(--border)",
          background: "var(--bg-1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), var(--accent-light, #a855f7))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#fff",
                boxShadow: "0 0 12px var(--glow)",
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                Caspian Assistant
                <span
                  style={{
                    fontSize: "9px",
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "var(--accent)",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    fontWeight: 700,
                  }}
                >
                  GPT-OSS-120b
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Telegram & Web Bot</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="icon-btn"
              title="Integrations Settings"
              style={{ width: "28px", height: "28px" }}
              onClick={() => {
                closeBotChat();
                openIntegrations();
              }}
            >
              ⚡
            </button>
            <button className="modal-close" onClick={closeBotChat}>
              ✕
            </button>
          </div>
        </div>

        {/* Message History */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "12px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: msg.role === "user" ? "var(--accent)" : "var(--bg-2)",
                  color: msg.role === "user" ? "#000" : "var(--text-main)",
                  border: msg.role === "user" ? "none" : "1px solid var(--border)",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  fontWeight: msg.role === "user" ? 500 : 400,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>

              {/* Tool Execution Badge */}
              {msg.executedAction && (
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "10px",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#4ade80",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  ⚡ Action Executed: {msg.executedAction.type.toUpperCase()}
                  {msg.executedAction.title ? ` "${msg.executedAction.title}"` : ""}
                </div>
              )}

              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", padding: "0 4px" }}>
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px" }}>
              <span className="spinning-loader">⏳</span> Caspian Bot is processing with GPT-OSS-120b...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div style={{ padding: "8px 16px", display: "flex", gap: "6px", overflowX: "auto" }}>
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              style={{
                fontSize: "11px",
                whiteSpace: "nowrap",
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                padding: "4px 8px",
                borderRadius: "12px",
                cursor: "pointer",
              }}
              onClick={() => handleSendMessage(prompt)}
            >
              + {prompt}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-2)",
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, fontSize: "13px" }}
            placeholder="Ask bot to schedule or query calendar..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn-submit" disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
