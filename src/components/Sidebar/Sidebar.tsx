"use client";

import React from "react";
import { Brand } from "./Brand";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarFilters } from "./CalendarFilters";
import { UserCard } from "./UserCard";
import { useCalendar } from "@/context/CalendarContext";
import { useTheme } from "@/context/ThemeContext";

export const Sidebar: React.FC = () => {
  const { openNewEventModal, isMobileSidebarOpen, closeMobileSidebar } = useCalendar();
  const { openThemeModal, accentColor } = useTheme();

  return (
    <>
      {isMobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar} />
      )}
      <aside className={`sidebar ${isMobileSidebarOpen ? "mobile-drawer-open" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", position: "relative", zIndex: 10 }}>
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
              flexShrink: 0,
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
          <button
            className="sidebar-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              closeMobileSidebar();
            }}
            title="Close Navigation"
          >
            ✕
          </button>
        </div>

        <button
          className="new-event-btn"
          onClick={() => {
            closeMobileSidebar();
            openNewEventModal();
          }}
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
      </aside>
    </>
  );
};
