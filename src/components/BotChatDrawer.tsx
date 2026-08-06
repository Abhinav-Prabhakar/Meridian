"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";
import { BotChatMessage } from "@/lib/bot/types";
import { MarkdownRenderer } from "./MarkdownRenderer";

export const BotChatDrawer: React.FC = () => {
  const { isBotChatOpen, closeBotChat, addEvent, updateEvent, deleteEvent, events, openIntegrations, selectedDate } = useCalendar();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<BotChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "Hello Alex! I am your **Groq GPT-OSS-120b** Calendar AI Assistant.\n\nI can execute actions on your calendar:\n- **Add**: `Schedule Strategy Meeting tomorrow at 3pm`\n- **Edit**: `Reschedule Strategy Meeting to 4pm`\n- **Remove**: `Cancel Strategy Meeting`\n- **View**: `What's on my schedule today?`",
      timestamp: "Just now",
      channel: "web",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isBotChatOpen) {
      scrollToBottom();
    }
  }, [messages, isBotChatOpen]);

  if (!isBotChatOpen) return null;

  // File drop handler
  const handleFileDrop = (files: FileList | File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      showToast("Please drop an image file (PNG, JPG, WEBP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
        showToast("📷 Image attached!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileDrop(e.dataTransfer.files);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if ((!queryText && !imagePreview) || isLoading) return;

    const userMsg: BotChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: queryText || "Attached image request",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      image: imagePreview || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentImage = imagePreview;
    if (!textToSend) setInput("");
    setImagePreview(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          image: currentImage,
          clientEvents: events,
          today: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const assistantMsg: BotChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          toolCalls: data.toolCalls,
          executedAction: data.executedAction,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Execute Live Calendar State Mutations in CalendarContext
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
          showToast(`✨ Added "${data.newEvent.title}" to your calendar!`);
        } else if (data.updatedEvent) {
          updateEvent(data.updatedEvent.id, {
            dateStr: data.updatedEvent.dateStr,
            start: data.updatedEvent.start,
            dur: data.updatedEvent.dur,
            title: data.updatedEvent.title,
            cat: data.updatedEvent.cat,
            time: data.updatedEvent.time,
            meta: data.updatedEvent.meta,
            attendees: data.updatedEvent.attendees,
          });
          showToast(`✏️ Updated "${data.updatedEvent.title}" on calendar!`);
        } else if (data.deletedId) {
          deleteEvent(data.deletedId);
          showToast(`🗑️ Removed event from calendar!`);
        }
      } else {
        showToast(data.error || "Failed to contact Groq assistant server");
      }
    } catch {
      showToast("Error communicating with AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "Schedule Team Sync tomorrow at 4pm",
    "Reschedule Daily Standup to 11:30am",
    "Remove Daily Standup",
    "What's on my schedule today?",
  ];

  return (
    <div className="modal-overlay" style={{ justifyContent: "flex-end" }} onClick={closeBotChat}>
      <div
        className="modal-content fade-up"
        style={{
          width: "440px",
          height: "100vh",
          maxHeight: "100vh",
          borderRadius: "0",
          margin: "0",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          borderLeft: "1px solid var(--border)",
          background: "var(--bg-1)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay Zone */}
        {isDragging && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 100,
              background: "rgba(15, 23, 42, 0.92)",
              backdropFilter: "blur(6px)",
              border: "2px dashed var(--accent)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "var(--accent)",
            }}
          >
            <span style={{ fontSize: "42px" }}>📷</span>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Drop Image Here</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Attach image to calendar assistant query
            </div>
          </div>
        )}

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
                background: "linear-gradient(135deg, var(--accent), #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                boxShadow: "0 0 12px var(--glow)",
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                Groq Calendar AI
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
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Full CRUD Calendar Assistant & Vision
              </div>
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
                  maxWidth: "88%",
                  padding: "12px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: msg.role === "user" ? "var(--accent)" : "var(--bg-2)",
                  color: msg.role === "user" ? "#000" : "var(--text-main)",
                  border: msg.role === "user" ? "none" : "1px solid var(--border)",
                  fontSize: "13px",
                }}
              >
                {/* Embedded Image Preview */}
                {msg.image && (
                  <div style={{ marginBottom: "8px" }}>
                    <img
                      src={msg.image}
                      alt="Attachment"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "180px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    />
                  </div>
                )}

                {msg.role === "assistant" ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div>{msg.content}</div>
                )}
              </div>

              {/* Action Badge */}
              {msg.executedAction && (
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "10px",
                    background:
                      msg.executedAction.type === "delete"
                        ? "rgba(239, 68, 68, 0.15)"
                        : msg.executedAction.type === "edit"
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(34, 197, 94, 0.15)",
                    border: `1px solid ${
                      msg.executedAction.type === "delete"
                        ? "rgba(239, 68, 68, 0.4)"
                        : msg.executedAction.type === "edit"
                        ? "rgba(59, 130, 246, 0.4)"
                        : "rgba(34, 197, 94, 0.4)"
                    }`,
                    color:
                      msg.executedAction.type === "delete"
                        ? "#f87171"
                        : msg.executedAction.type === "edit"
                        ? "#60a5fa"
                        : "#4ade80",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  ⚡ Executed: {msg.executedAction.type.toUpperCase()}
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
              <span className="spinning-loader">⏳</span> Groq GPT-OSS-120b executing calendar tools...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div style={{ padding: "6px 16px", display: "flex", gap: "6px", overflowX: "auto" }}>
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

        {/* Image Attachment Preview Thumbnail */}
        {imagePreview && (
          <div style={{ padding: "8px 16px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--accent)" }}
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Image ready to send</span>
          </div>
        )}

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
            alignItems: "center",
          }}
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) handleFileDrop(e.target.files);
            }}
          />
          <button
            type="button"
            className="icon-btn"
            title="Attach image (or drag & drop)"
            style={{ width: "34px", height: "34px" }}
            onClick={() => fileInputRef.current?.click()}
          >
            📷
          </button>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, fontSize: "13px" }}
            placeholder="Ask AI to add, edit, remove, or view events..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn-submit" disabled={isLoading || (!input.trim() && !imagePreview)}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
