"use client";

import React from "react";
import { Brand } from "./Brand";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarFilters } from "./CalendarFilters";
import { UserCard } from "./UserCard";
import { useCalendar } from "@/context/CalendarContext";
import { useTheme } from "@/context/ThemeContext";

export const Sidebar: React.FC = () => {
  const { openNewEventModal, openShortcuts } = useCalendar();
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

      <MiniCalendar />
      <CalendarFilters />
      <UserCard />

      <button
        className="link-btn"
        style={{
          marginTop: "auto",
          fontSize: "10px",
          color: "var(--fg-3)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 0",
        }}
        onClick={openShortcuts}
      >
        <kbd
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            padding: "1px 5px",
            background: "var(--bg-2)",
            color: "var(--accent)",
            border: "1px solid var(--border)",
          }}
        >
          ?
        </kbd>
        <span>Keyboard Shortcuts</span>
      </button>
    </aside>
  );
};
