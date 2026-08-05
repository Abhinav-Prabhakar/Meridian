"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, closeShortcuts } = useCalendar();

  if (!isShortcutsOpen) return null;

  const navigationShortcuts = [
    { key: "T", description: "Jump to Today" },
    { key: "D", description: "Switch to Day View" },
    { key: "W", description: "Switch to Week View" },
    { key: "M", description: "Switch to Month View" },
    { key: "A", description: "Switch to Agenda View" },
    { key: "J / ←", description: "Navigate to Previous period" },
    { key: "K / →", description: "Navigate to Next period" },
  ];

  const actionShortcuts = [
    { key: "N / C", description: "Create new calendar event" },
    { key: "/ / S", description: "Open Search command palette" },
    { key: "E", description: "Export / Share calendar modal" },
    { key: "R", description: "Open Weekly Analytics report" },
    { key: "P", description: "Open Theme Accent Customizer" },
    { key: "?", description: "Toggle Keyboard Shortcuts guide" },
    { key: "Esc", description: "Close any open modal or overlay" },
  ];

  return (
    <div className="modal-overlay" onClick={closeShortcuts}>
      <div
        className="modal-content"
        style={{ maxWidth: "520px", padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "16px" }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: "18px" }}>
              Keyboard Shortcuts Cheatsheet
            </h2>
            <div style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "JetBrains Mono, monospace" }}>
              Professional Hotkeys & Navigation
            </div>
          </div>
          <button className="modal-close" onClick={closeShortcuts}>
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div className="form-label" style={{ marginBottom: "10px", color: "var(--accent)" }}>
              View & Navigation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {navigationShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--fg-2)" }}>{item.description}</span>
                  <kbd
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "10px",
                      padding: "2px 6px",
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

          <div>
            <div className="form-label" style={{ marginBottom: "10px", color: "var(--accent)" }}>
              Actions & Controls
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {actionShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--fg-2)" }}>{item.description}</span>
                  <kbd
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "10px",
                      padding: "2px 6px",
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
      </div>
    </div>
  );
};
