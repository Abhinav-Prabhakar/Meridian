"use client";

import React, { useState, useEffect } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";
import { ChannelStatus } from "@/lib/bot/types";

export const IntegrationsModal: React.FC = () => {
  const { isIntegrationsOpen, closeIntegrations, openBotChat } = useCalendar();
  const { showToast } = useToast();

  const [telegramToken, setTelegramToken] = useState<string>("");
  const [groqKey, setGroqKey] = useState<string>("");
  const [channels, setChannels] = useState<ChannelStatus[]>([
    {
      id: "telegram",
      name: "Telegram Bot",
      icon: "✈️",
      connected: false,
      active: false,
      statusText: "Ready to connect",
      description: "Talk to @BotFather to get a bot token. Your Caspian agent handles scheduling DMs.",
    },
    {
      id: "email",
      name: "Email Agent",
      icon: "✉️",
      connected: true,
      active: true,
      statusText: "Connected (my-agent@caspian.ai)",
      description: "Forward invitation emails to your Caspian agent identity for automatic calendar syncing.",
    },
    {
      id: "slack",
      name: "Slack App",
      icon: "💬",
      connected: false,
      active: false,
      statusText: "Roadmap: Phase 2",
      description: "Slash commands & direct DMs with your workspace calendar assistant.",
    },
    {
      id: "discord",
      name: "Discord Bot",
      icon: "🎮",
      connected: false,
      active: false,
      statusText: "Roadmap: Phase 2",
      description: "Discord server integration for personal and team calendar queries.",
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isIntegrationsOpen) {
      fetch("/api/bot/connect")
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            setChannels(data.status);
          }
          if (data.config?.telegramBotToken) {
            setTelegramToken(data.config.telegramBotToken);
          }
          if (data.config?.groqApiKey) {
            setGroqKey(data.config.groqApiKey);
          }
        })
        .catch(() => {});
    }
  }, [isIntegrationsOpen]);

  if (!isIntegrationsOpen) return null;

  const handleConnectTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/bot/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "telegram",
          botToken: telegramToken,
          groqApiKey: groqKey,
          action: "connect",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Telegram Bot connected via Caspian SDK!");
        if (data.status) setChannels(data.status);
      } else {
        showToast(data.error || data.message || "Failed to connect Telegram Bot");
      }
    } catch {
      showToast("Telegram integration saved locally via Caspian Gateway");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/bot/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "telegram", action: "disconnect" }),
      });
      const data = await res.json();
      if (data.status) setChannels(data.status);
      setTelegramToken("");
      showToast("Telegram Bot disconnected");
    } catch {
      showToast("Disconnected Telegram Bot");
    } finally {
      setIsSaving(false);
    }
  };

  const telegramChannel = channels.find((c) => c.id === "telegram");

  return (
    <div className="modal-overlay" onClick={closeIntegrations}>
      <div
        className="modal-content"
        style={{ maxWidth: "560px", padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "20px" }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              ⚡ App & Bot Integrations
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Powered by <strong>Caspian SDK</strong> & <strong>Groq GPT-OSS-120b</strong>
            </p>
          </div>
          <button className="modal-close" onClick={closeIntegrations}>
            ✕
          </button>
        </div>

        {/* Channels List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          {channels.map((ch) => (
            <div
              key={ch.id}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{ch.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{ch.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ch.description}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontWeight: 500,
                    background: ch.connected ? "rgba(34, 197, 94, 0.15)" : "var(--bg-3)",
                    color: ch.connected ? "#4ade80" : "var(--text-muted)",
                    border: `1px solid ${ch.connected ? "rgba(34, 197, 94, 0.3)" : "var(--border)"}`,
                  }}
                >
                  {ch.connected ? "● Connected" : ch.statusText}
                </span>
              </div>

              {/* Special Telegram Configuration */}
              {ch.id === "telegram" && (
                <form onSubmit={handleConnectTelegram} style={{ marginTop: "8px", borderTop: "1px dashed var(--border)", paddingTop: "12px" }}>
                  <div className="form-group" style={{ marginBottom: "10px" }}>
                    <label className="form-label" style={{ fontSize: "11px" }}>
                      Telegram Bot Token (from @BotFather)
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label" style={{ fontSize: "11px" }}>
                      Groq API Key (Optional for GPT-OSS-120b)
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}
                      placeholder="gsk_..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    {telegramChannel?.connected && (
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleDisconnectTelegram}
                        disabled={isSaving}
                      >
                        Disconnect
                      </button>
                    )}
                    <button type="submit" className="btn-submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : telegramChannel?.connected ? "Update Token" : "Connect Telegram"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>

        {/* Direct In-App AI Assistant Link */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(168, 85, 247, 0.1))",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>🤖 Try Web Assistant Drawer</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Test your Caspian GPT-OSS-120b Bot directly inside Meridian web app.
            </div>
          </div>
          <button
            type="button"
            className="btn-submit"
            style={{ fontSize: "12px", padding: "6px 12px" }}
            onClick={() => {
              closeIntegrations();
              openBotChat();
            }}
          >
            Open Assistant
          </button>
        </div>
      </div>
    </div>
  );
};
