"use client";

import React, { useState } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

interface DayCell {
  num: number;
  dateStr: string;
  muted: boolean;
  hasEvent: boolean;
  today: boolean;
  selected: boolean;
}

export const MiniCalendar: React.FC = () => {
  const { miniCalMonth, setMiniCalMonth, selectedDate, setSelectedDate, events } = useCalendar();
  const { showToast } = useToast();
  const [showPicker, setShowPicker] = useState(false);

  const year = miniCalMonth.getFullYear();
  const month = miniCalMonth.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    setMiniCalMonth(prev);
    showToast(`Showing ${monthNames[prev.getMonth()]} ${prev.getFullYear()}`);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    setMiniCalMonth(next);
    showToast(`Showing ${monthNames[next.getMonth()]} ${next.getFullYear()}`);
  };

  // Build grid
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

  const firstDayObj = new Date(year, month, 1);
  let startDayOfWeek = firstDayObj.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6; // Sunday = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayObj = new Date();
  const todayDateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  const cells: DayCell[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const num = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, num);
    const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`;
    const hasEvent = events.some((e) => e.dateStr === dateStr);
    cells.push({
      num,
      dateStr,
      muted: true,
      hasEvent,
      today: dateStr === todayDateStr,
      selected: dateStr === selectedDateStr,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const hasEvent = events.some((e) => e.dateStr === dateStr);
    cells.push({
      num: i,
      dateStr,
      muted: false,
      hasEvent,
      today: dateStr === todayDateStr,
      selected: dateStr === selectedDateStr,
    });
  }

  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const hasEvent = events.some((e) => e.dateStr === dateStr);
    cells.push({
      num: i,
      dateStr,
      muted: true,
      hasEvent,
      today: dateStr === todayDateStr,
      selected: dateStr === selectedDateStr,
    });
  }

  const handleCellClick = (cell: DayCell) => {
    if (cell.muted) return;
    const [y, m, d] = cell.dateStr.split("-").map(Number);
    const targetDate = new Date(y, m - 1, d);
    setSelectedDate(targetDate);
    showToast(`Jumped to ${monthNames[m - 1].slice(0, 3)} ${d}`);
  };

  return (
    <div className="mini-cal">
      <div className="mini-cal-header" style={{ position: "relative" }}>
        <span
          className="mini-cal-title"
          style={{ cursor: "pointer", textDecoration: "underline rgba(255,255,255,0.2)" }}
          onClick={() => setShowPicker(!showPicker)}
          title="Click to select month/year"
        >
          {monthNames[month]} {year} ▾
        </span>

        {showPicker && (
          <div
            style={{
              position: "absolute",
              top: "24px",
              left: 0,
              zIndex: 20,
              background: "var(--bg-1)",
              border: "1px solid var(--border-bright)",
              padding: "8px",
              display: "flex",
              gap: "6px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <select
              className="form-select"
              style={{ fontSize: "11px", padding: "4px" }}
              value={month}
              onChange={(e) => {
                const m = parseInt(e.target.value);
                setMiniCalMonth(new Date(year, m, 1));
                setShowPicker(false);
              }}
            >
              {monthNames.map((mName, mIdx) => (
                <option key={mIdx} value={mIdx}>
                  {mName}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              style={{ fontSize: "11px", padding: "4px" }}
              value={year}
              onChange={(e) => {
                const y = parseInt(e.target.value);
                setMiniCalMonth(new Date(y, month, 1));
                setShowPicker(false);
              }}
            >
              {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mini-cal-nav">
          <button title="Previous month" onClick={handlePrevMonth}>
            ‹
          </button>
          <button title="Next month" onClick={handleNextMonth}>
            ›
          </button>
        </div>
      </div>

      <div className="mini-cal-grid">
        {dayNames.map((d, i) => (
          <div key={i} className="mini-cal-day-name">
            {d}
          </div>
        ))}
        {cells.map((cell, idx) => {
          const classes = ["mini-cal-day"];
          if (cell.muted) classes.push("muted");
          if (cell.today) classes.push("today");
          if (cell.selected) classes.push("selected");
          if (cell.hasEvent) classes.push("has-event");

          return (
            <div
              key={idx}
              className={classes.join(" ")}
              onClick={() => handleCellClick(cell)}
            >
              {cell.num}
            </div>
          );
        })}
      </div>
    </div>
  );
};
