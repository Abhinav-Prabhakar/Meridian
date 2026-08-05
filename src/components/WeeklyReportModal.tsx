"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";

export const WeeklyReportModal: React.FC = () => {
  const { isReportOpen, closeReport, selectedDate, events } = useCalendar();

  if (!isReportOpen) return null;

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const weekDatesStr = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const weekEvents = events.filter((e) => weekDatesStr.includes(e.dateStr));

  const totalHours = weekEvents.reduce((acc, e) => acc + e.dur, 0);
  const meetingsHours = weekEvents.filter((e) => e.cat === "meeting").reduce((acc, e) => acc + e.dur, 0);
  const focusHours = weekEvents.filter((e) => e.cat === "focus").reduce((acc, e) => acc + e.dur, 0);
  const strategyHours = weekEvents.filter((e) => e.cat === "strategy").reduce((acc, e) => acc + e.dur, 0);
  const personalHours = weekEvents.filter((e) => e.cat === "personal").reduce((acc, e) => acc + e.dur, 0);

  const calcPct = (h: number) => (totalHours > 0 ? Math.round((h / totalHours) * 100) : 0);

  return (
    <div className="modal-overlay" onClick={closeReport}>
      <div
        className="modal-content"
        style={{ maxWidth: "460px", padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "16px" }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: "18px" }}>
              Weekly Analytics Report
            </h2>
            <div style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "JetBrains Mono, monospace" }}>
              Time Allocation Summary
            </div>
          </div>
          <button className="modal-close" onClick={closeReport}>
            ✕
          </button>
        </div>

        {/* Productivity Score */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="form-label">Productivity Score</div>
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              88<span style={{ fontSize: "14px", color: "var(--fg-3)" }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", color: "var(--fg-2)" }}>
            <div>Total Scheduled: {totalHours.toFixed(1)}h</div>
            <div style={{ color: "var(--accent)", marginTop: "2px" }}>+12% Focus vs Target</div>
          </div>
        </div>

        {/* Breakdown progress bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
              <span>Meetings</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {meetingsHours.toFixed(1)}h ({calcPct(meetingsHours)}%)
              </span>
            </div>
            <div style={{ height: "6px", background: "var(--bg-3)", width: "100%" }}>
              <div style={{ height: "100%", width: `${calcPct(meetingsHours)}%`, background: "var(--orange)" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
              <span>Focus Time</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {focusHours.toFixed(1)}h ({calcPct(focusHours)}%)
              </span>
            </div>
            <div style={{ height: "6px", background: "var(--bg-3)", width: "100%" }}>
              <div style={{ height: "100%", width: `${calcPct(focusHours)}%`, background: "var(--cyan)" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
              <span>Strategy</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {strategyHours.toFixed(1)}h ({calcPct(strategyHours)}%)
              </span>
            </div>
            <div style={{ height: "6px", background: "var(--bg-3)", width: "100%" }}>
              <div style={{ height: "100%", width: `${calcPct(strategyHours)}%`, background: "var(--accent)" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
              <span>Personal</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {personalHours.toFixed(1)}h ({calcPct(personalHours)}%)
              </span>
            </div>
            <div style={{ height: "6px", background: "var(--bg-3)", width: "100%" }}>
              <div style={{ height: "100%", width: `${calcPct(personalHours)}%`, background: "var(--pink)" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
