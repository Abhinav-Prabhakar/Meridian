"use client";

import React from "react";
import { Brand } from "./Brand";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarFilters } from "./CalendarFilters";
import { UserCard } from "./UserCard";
import { useCalendar } from "@/context/CalendarContext";
import { useTheme } from "@/context/ThemeContext";

export const Sidebar: React.FC = () => {
  const { openNewEventModal, openBotChat, openIntegrations } = useCalendar();
  const { openThemeModal, accentColor } = useTheme();

  return (
    <aside className="sidebar fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <Brand />
        </div>
        <button
          title="Customize Theme Color"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={openThemeModal}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: accentColor,
            }}
          ></span>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          className="new-event-btn"
          onClick={() => openNewEventModal()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New Event</span>
          <kbd>N</kbd>
        </button>

        <button
          className="new-event-btn"
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(168, 85, 247, 0.2))",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            color: "var(--text-main)",
          }}
          onClick={() => openBotChat()}
        >
          <span>🤖 AI Assistant</span>
          <kbd>B</kbd>
        </button>
      </div>

      <MiniCalendar />
      <CalendarFilters />
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
        <button
          onClick={openIntegrations}
          style={{
            width: "100%",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "var(--text-muted)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <span>⚡ Telegram & Caspian Bot</span>
          <span style={{ fontSize: "10px", background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "2px 6px", borderRadius: "10px" }}>
            Active
          </span>
        </button>
      </div>
      <UserCard />
    </aside>
  );
};
