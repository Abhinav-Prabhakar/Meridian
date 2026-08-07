"use client";

import React from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { addDays, eventsForDate, formatDateStr } from "@/lib/dateUtils";

const categoryColors: Record<string, { color: string; bg: string }> = {
  strategy: { color: "var(--accent)", bg: "var(--accent-dim)" },
  meeting: { color: "var(--orange)", bg: "var(--orange-dim)" },
  focus: { color: "var(--cyan)", bg: "var(--cyan-dim)" },
  personal: { color: "var(--pink)", bg: "var(--pink-dim)" },
  travel: { color: "var(--yellow)", bg: "var(--yellow-dim)" },
};

export const AgendaView: React.FC = () => {
  const { events, openEventDetails, setSelectedDate, selectedDate } = useCalendar();
  const { activeCategories } = useCalendarFilter();

  // Group events by dateStr
  const groupedEvents: Record<string, CalendarEvent[]> = {};
  for (let offset = -30; offset <= 90; offset += 1) {
    const dateStr = formatDateStr(addDays(selectedDate, offset));
    eventsForDate(events, dateStr)
      .filter((event) => activeCategories[event.cat])
      .forEach((event) => {
        if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
        groupedEvents[dateStr].push(event);
      });
  }

  Object.values(groupedEvents).forEach((dayEvents) => dayEvents.sort((a, b) => a.start - b.start));

  const sortedDates = Object.keys(groupedEvents).sort();

  const formatDateHeader = (dStr: string) => {
    const [y, m, d] = dStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleEventClick = (ev: CalendarEvent) => {
    const [y, m, d] = ev.dateStr.split("-").map(Number);
    setSelectedDate(new Date(y, m - 1, d));
    openEventDetails(ev);
  };

  return (
    <div className="calendar-area fade-up fade-up-2" style={{ padding: "24px 32px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--fg)",
            margin: 0,
          }}
        >
          Agenda Feed
        </h2>
        <div style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "JetBrains Mono, monospace" }}>
          Chronological schedule feed
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--fg-3)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "12px",
          }}
        >
          No scheduled events found matching active filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {sortedDates.map((dStr) => (
            <div key={dStr}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "Space Grotesk, sans-serif",
                  letterSpacing: "0.05em",
                  color: "var(--accent)",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "6px",
                  marginBottom: "12px",
                }}
              >
                {formatDateHeader(dStr)}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {groupedEvents[dStr].map((ev) => {
                  const style = categoryColors[ev.cat] || {
                    color: "var(--accent)",
                    bg: "var(--accent-dim)",
                  };

                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "var(--bg-2)",
                        border: "1px solid var(--border)",
                        borderLeft: `3px solid ${style.color}`,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      className="agenda-item"
                      onClick={() => handleEventClick(ev)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "11px",
                            color: "var(--fg-2)",
                            minWidth: "100px",
                          }}
                        >
                          {ev.allDay ? "All day" : ev.time}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "13px",
                              color: "var(--fg)",
                              marginBottom: "2px",
                            }}
                          >
                            {ev.title}
                          </div>
                          {ev.meta && (
                            <div style={{ fontSize: "10px", color: "var(--fg-3)" }}>
                              📍 {ev.meta}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          padding: "3px 8px",
                          background: style.bg,
                          color: style.color,
                        }}
                      >
                        {ev.cat}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
