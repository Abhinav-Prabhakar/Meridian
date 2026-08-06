"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";
import { Scratchpad } from "./Scratchpad";
import { formatDateStr } from "@/lib/dateUtils";

export const DetailPanel: React.FC = () => {
  const { selectedDate, events, openEventDetails, openReport } = useCalendar();
  const { showToast } = useToast();

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  // Compute 7 dates for current week
  const weekDatesStr = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const weekEvents = events.filter((e) => weekDatesStr.includes(e.dateStr));

  // 1. Next Up calculation
  const todayStr = formatDateStr(new Date());
  const nextEvent =
    events
      .filter((e) => e.dateStr >= todayStr)
      .sort((a, b) => (a.dateStr + a.start).localeCompare(b.dateStr + b.start))[0] || {
      id: "demo",
      dateStr: todayStr,
      start: 15,
      title: "Architecture Review",
      cat: "focus",
      time: "15:00 — 16:00",
      dur: 1,
      attendees: ["SC", "MR", "JD", "+3"],
    };

  // Helper to round numbers to 1-2 decimals cleanly without floating point artifacts
  const formatNumber = (val: number, maxDecimals: number = 1): string => {
    const factor = Math.pow(10, maxDecimals);
    const rounded = Math.round(val * factor) / factor;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(maxDecimals);
  };

  // 2. This week stats
  const meetingsCount = weekEvents.filter((e) => e.cat === "meeting").length;
  const rawFocus = weekEvents.filter((e) => e.cat === "focus").reduce((acc, e) => acc + e.dur, 0);
  const rawCalls = weekEvents.filter((e) => e.cat === "meeting" || e.cat === "strategy").reduce((acc, e) => acc + e.dur, 0);
  const focusHours = formatNumber(rawFocus);
  const callHours = formatNumber(rawCalls);

  // 3. Daily load calculation (Mon..Sun)
  const dailyHours = weekDatesStr.map((dStr) =>
    events.filter((e) => e.dateStr === dStr).reduce((acc, e) => acc + e.dur, 0)
  );

  const selectedDateIdx = weekDatesStr.indexOf(todayStr);
  const activeDayIdx = selectedDateIdx >= 0 ? selectedDateIdx : 2;
  const todayHoursNum = dailyHours[activeDayIdx] || 5.2;
  const todayHours = formatNumber(todayHoursNum);

  // 4. Upcoming agenda items
  const sortedUpcoming = events
    .filter((e) => e.dateStr >= todayStr)
    .sort((a, b) => (a.dateStr + a.start).localeCompare(b.dateStr + b.start))
    .slice(0, 5);

  const dayAbbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <aside className="detail-panel fade-up fade-up-3">
      {/* Next up */}
      <div className="detail-section">
        <div className="section-header">
          <span className="label">Next up</span>
          <span className="meta">in 18 min</span>
        </div>
        <div className="next-event">
          <span className="next-event-tag">
            {nextEvent.cat ? nextEvent.cat.toUpperCase() : "FOCUS"}
          </span>
          <h3 className="next-event-title">{nextEvent.title}</h3>
          <div className="next-event-time">
            {nextEvent.time}{" "}
            <span className="duration">· {Math.round((nextEvent.dur || 1) * 60)}m</span>
          </div>
          <div className="next-event-attendees">
            <div className="att-circle c1">SC</div>
            <div className="att-circle c2">MR</div>
            <div className="att-circle c3">JD</div>
            <span className="att-more">+ 3 more</span>
          </div>
          <button
            className="join-btn"
            onClick={() => showToast(`Opening meeting room: ${nextEvent.title}`)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Join meeting
          </button>
        </div>
      </div>

      {/* This week */}
      <div className="detail-section">
        <div className="section-header">
          <span className="label">This week</span>
          <button className="link-btn" onClick={openReport}>
            REPORT →
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-value">{meetingsCount}</div>
            <div className="stat-label">Meetings</div>
            <div className="stat-trend up">↑ 3 vs last wk</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {focusHours}
              <span className="unit">h</span>
            </div>
            <div className="stat-label">Focus time</div>
            <div className="stat-trend up">↑ 1.2h</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              87<span className="unit">%</span>
            </div>
            <div className="stat-label">Attendance</div>
            <div className="stat-trend down">↓ 4%</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {callHours}
              <span className="unit">h</span>
            </div>
            <div className="stat-label">In calls</div>
            <div className="stat-trend up">↑ 2h</div>
          </div>
        </div>
      </div>

      {/* Daily load */}
      <div className="detail-section">
        <div className="section-header">
          <span className="label">Daily load</span>
          <span
            className="meta"
            style={{ color: todayHoursNum > 4 ? "var(--orange)" : "var(--accent)" }}
          >
            {todayHoursNum > 4 ? `+${Math.round(((todayHoursNum - 4) / 4) * 100)}% OVER` : "ON TARGET"}
          </span>
        </div>
        <div className="sparkline-card">
          <div className="sparkline-header">
            <div>
              <div className="sparkline-title">Selected</div>
              <div className="sparkline-value">
                {todayHours}
                <span style={{ color: "var(--fg-3)", fontSize: "12px" }}>h</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="sparkline-title">Target</div>
              <div className="sparkline-value" style={{ color: "var(--fg-3)" }}>
                4.0<span style={{ fontSize: "12px" }}>h</span>
              </div>
            </div>
          </div>
          <div className="sparkline-bars">
            {dailyHours.map((h, i) => {
              const heightPct = Math.min(100, Math.max(10, Math.round((h / 6) * 100)));
              const isActive = i === activeDayIdx;
              return (
                <div
                  key={i}
                  className={`sparkline-bar ${isActive ? "active" : ""}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${dayAbbrs[i]}: ${formatNumber(h)}h`}
                ></div>
              );
            })}
          </div>
          <div className="sparkline-labels">
            {["M", "T", "W", "T", "F", "S", "S"].map((lbl, i) => (
              <span key={i} className={i === activeDayIdx ? "active" : ""}>
                {lbl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="detail-section">
        <div className="section-header">
          <span className="label">Upcoming</span>
          <button className="link-btn" onClick={() => showToast("Showing all upcoming events")}>
            VIEW ALL →
          </button>
        </div>

        {sortedUpcoming.map((ev) => {
          const catColors: Record<string, string> = {
            strategy: "var(--accent)",
            meeting: "var(--orange)",
            focus: "var(--cyan)",
            personal: "var(--pink)",
            travel: "var(--yellow)",
          };
          const dateParts = ev.dateStr.split("-");
          const evDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
          const isEvToday = ev.dateStr === todayStr;
          const dayLabel = isEvToday ? "TODAY" : dayAbbrs[(evDate.getDay() + 6) % 7].toUpperCase();

          return (
            <div
              key={ev.id}
              className="upcoming-item"
              onClick={() => openEventDetails(ev)}
            >
              <div className="upcoming-time">
                {ev.allDay ? "All day" : ev.time.split(" — ")[0]}
                <span className="day">{dayLabel}</span>
              </div>
              <div className="upcoming-info">
                <div className="upcoming-title">{ev.title}</div>
                <div className="upcoming-meta">
                  {ev.meta || `${Math.round(ev.dur * 60)}m`}
                </div>
              </div>
              <div
                className="upcoming-dot"
                style={{ background: catColors[ev.cat] || "var(--accent)" }}
              ></div>
            </div>
          );
        })}
      </div>

      {/* Scratchpad */}
      <Scratchpad />
    </aside>
  );
};
