"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, closeShortcuts } = useCalendar();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: "N", description: "Quick-add a new calendar event" },
    { key: "T", description: "Reset view and scroll to today" },
    { key: "/", description: "Open search command palette" },
    { key: "← / →", description: "Navigate previous / next week or day" },
    { key: "?", description: "Toggle keyboard shortcuts guide" },
  ];

  return (
    <div className="modal-overlay" onClick={closeShortcuts}>
      <div
        className="modal-content"
        style={{ maxWidth: "420px", padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "16px" }}>
          <h2 className="modal-title" style={{ fontSize: "18px" }}>
            Keyboard Shortcuts
          </h2>
          <button className="modal-close" onClick={closeShortcuts}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--fg-2)" }}>{item.description}</span>
              <kbd
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "11px",
                  padding: "2px 8px",
                  background: "var(--bg-3)",
                  color: "var(--accent)",
                  fontWeight: 600,
                  border: "1px solid var(--border-bright)",
                }}
              >
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
