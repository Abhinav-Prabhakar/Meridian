"use client";

import React, { useState } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

const categoryColors: Record<string, { bg: string; color: string; label: string }> = {
  strategy: { bg: "var(--accent-dim)", color: "var(--accent)", label: "STRATEGY" },
  meeting: { bg: "var(--orange-dim)", color: "var(--orange)", label: "MEETING" },
  focus: { bg: "var(--cyan-dim)", color: "var(--cyan)", label: "FOCUS" },
  personal: { bg: "var(--pink-dim)", color: "var(--pink)", label: "PERSONAL" },
  travel: { bg: "var(--yellow-dim)", color: "var(--yellow)", label: "TRAVEL" },
};

export const EventDetailModal: React.FC = () => {
  const { viewingEvent, closeEventDetails, deleteEvent, openNewEventModal } = useCalendar();
  const { showToast } = useToast();
  const [rsvp, setRsvp] = useState<"going" | "maybe" | "declined">("going");

  if (!viewingEvent) return null;

  const catStyle = categoryColors[viewingEvent.cat] || {
    bg: "var(--accent-dim)",
    color: "var(--accent)",
    label: viewingEvent.cat.toUpperCase(),
  };

  const handleDelete = () => {
    deleteEvent(viewingEvent.id);
    showToast(`Deleted event: ${viewingEvent.title}`);
    closeEventDetails();
  };

  const handleEdit = () => {
    const evToEdit = { ...viewingEvent };
    closeEventDetails();
    openNewEventModal({
      id: evToEdit.id,
      dateStr: evToEdit.dateStr,
      startHour: evToEdit.start,
      dur: evToEdit.dur,
      title: evToEdit.title,
      cat: evToEdit.cat,
      meta: evToEdit.meta,
    });
  };

  const handleRsvpChange = (status: "going" | "maybe" | "declined") => {
    setRsvp(status);
    showToast(`Status updated: ${status.toUpperCase()}`);
  };

  return (
    <div className="modal-overlay" onClick={closeEventDetails}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="next-event-tag"
              style={{
                background: catStyle.bg,
                color: catStyle.color,
                margin: 0,
              }}
            >
              {catStyle.label}
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "2px 6px",
                background:
                  rsvp === "going"
                    ? "var(--accent-dim)"
                    : rsvp === "maybe"
                    ? "var(--yellow-dim)"
                    : "rgba(255, 77, 77, 0.15)",
                color:
                  rsvp === "going"
                    ? "var(--accent)"
                    : rsvp === "maybe"
                    ? "var(--yellow)"
                    : "var(--red)",
              }}
            >
              {rsvp.toUpperCase()}
            </span>
          </div>
          <button className="modal-close" onClick={closeEventDetails}>
            ✕
          </button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <h2 className="modal-title" style={{ fontSize: "22px", marginBottom: "8px" }}>
            {viewingEvent.title}
          </h2>
          <div className="next-event-time" style={{ fontSize: "14px" }}>
            {viewingEvent.time} <span className="duration">· {Math.round(viewingEvent.dur * 60)}m</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "JetBrains Mono, monospace" }}>
            Date: {viewingEvent.dateStr}
          </div>
        </div>

        {/* RSVP buttons */}
        <div style={{ marginBottom: "16px" }}>
          <div className="form-label" style={{ marginBottom: "6px" }}>
            RSVP Status
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "6px",
                fontSize: "11px",
                background: rsvp === "going" ? "var(--bg-3)" : "var(--bg-2)",
                border: rsvp === "going" ? "1px solid var(--accent)" : "1px solid var(--border)",
                color: rsvp === "going" ? "var(--accent)" : "var(--fg-2)",
                cursor: "pointer",
              }}
              onClick={() => handleRsvpChange("going")}
            >
              Going
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "6px",
                fontSize: "11px",
                background: rsvp === "maybe" ? "var(--bg-3)" : "var(--bg-2)",
                border: rsvp === "maybe" ? "1px solid var(--yellow)" : "1px solid var(--border)",
                color: rsvp === "maybe" ? "var(--yellow)" : "var(--fg-2)",
                cursor: "pointer",
              }}
              onClick={() => handleRsvpChange("maybe")}
            >
              Maybe
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "6px",
                fontSize: "11px",
                background: rsvp === "declined" ? "var(--bg-3)" : "var(--bg-2)",
                border: rsvp === "declined" ? "1px solid var(--red)" : "1px solid var(--border)",
                color: rsvp === "declined" ? "var(--red)" : "var(--fg-2)",
                cursor: "pointer",
              }}
              onClick={() => handleRsvpChange("declined")}
            >
              Decline
            </button>
          </div>
        </div>

        {viewingEvent.meta && (
          <div
            style={{
              background: "var(--bg-2)",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--fg-2)",
              marginBottom: "16px",
            }}
          >
            📍 {viewingEvent.meta}
          </div>
        )}

        {viewingEvent.attendees && viewingEvent.attendees.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div className="form-label" style={{ marginBottom: "8px" }}>
              Attendees
            </div>
            <div className="event-attendees" style={{ marginTop: 0 }}>
              {viewingEvent.attendees.map((att, i) => (
                <div key={i} className="att-circle" style={{ width: "28px", height: "28px", fontSize: "10px" }}>
                  {att}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ justifyContent: "space-between", marginTop: "24px" }}>
          <button
            type="button"
            className="btn-cancel"
            style={{ color: "var(--red)", borderColor: "rgba(255, 77, 77, 0.3)" }}
            onClick={handleDelete}
          >
            Delete Event
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="btn-cancel" onClick={closeEventDetails}>
              Close
            </button>
            <button type="button" className="btn-submit" onClick={handleEdit}>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
