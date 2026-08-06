"use client";

import React, { useState } from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";

export const SearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch, events, setSelectedDate, openEventDetails } = useCalendar();
  const [query, setQuery] = useState("");

  if (!isSearchOpen) return null;

  const filteredEvents = events.filter((ev) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.cat.toLowerCase().includes(q) ||
      (ev.meta && ev.meta.toLowerCase().includes(q))
    );
  });

  const handleSelectResult = (ev: CalendarEvent) => {
    const [y, m, d] = ev.dateStr.split("-").map(Number);
    setSelectedDate(new Date(y, m - 1, d));
    closeSearch();
    openEventDetails(ev);
  };

  const categoryColors: Record<string, string> = {
    strategy: "var(--accent)",
    meeting: "var(--orange)",
    focus: "var(--cyan)",
    personal: "var(--pink)",
    travel: "var(--yellow)",
  };

  return (
    <div className="modal-overlay" onClick={closeSearch}>
      <div
        className="modal-content"
        style={{ maxWidth: "520px", padding: "20px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "14px" }}>
          <h2 className="modal-title" style={{ fontSize: "16px" }}>
            Search Calendar
          </h2>
          <button className="modal-close" onClick={closeSearch}>
            ✕
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: "14px", padding: "10px 12px" }}
            placeholder="Type event title, category, or note..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div
          style={{
            maxHeight: "320px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {filteredEvents.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--fg-3)",
                fontSize: "12px",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              No events found matching "{query}"
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                className="search-result-item"
                onClick={() => handleSelectResult(ev)}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: categoryColors[ev.cat] || "var(--accent)",
                        flexShrink: 0,
                      }}
                    ></span>
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--fg)" }}>
                      {ev.title}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--fg-3)",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {ev.dateStr} · {ev.allDay ? "All day" : ev.time} {ev.meta ? `· ${ev.meta}` : ""}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "3px 6px",
                    background: "var(--bg-3)",
                    color: "var(--fg-2)",
                  }}
                >
                  {ev.cat}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
