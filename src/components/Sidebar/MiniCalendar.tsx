"use client";

import React from "react";
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

  // 1st of current month day-of-week (0=Mon, ..., 6=Sun)
  const firstDayObj = new Date(year, month, 1);
  let startDayOfWeek = firstDayObj.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6; // Sunday = 6

  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Total days in prev month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayObj = new Date();
  const todayDateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  const cells: DayCell[] = [];

  // Previous month padding
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

  // Current month days
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

  // Next month padding to complete 42 cells
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
      <div className="mini-cal-header">
        <span className="mini-cal-title">
          {monthNames[month]} {year}
        </span>
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
