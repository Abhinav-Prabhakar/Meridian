"use client";

import React from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { formatDateStr } from "@/lib/dateUtils";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const categoryColors: Record<string, string> = {
  strategy: "var(--accent)",
  meeting: "var(--orange)",
  focus: "var(--cyan)",
  personal: "var(--pink)",
  travel: "var(--yellow)",
};

export const MonthView: React.FC = () => {
  const { selectedDate, setSelectedDate, events, openEventDetails } = useCalendar();
  const { activeCategories } = useCalendarFilter();

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const firstDay = new Date(year, month, 1);
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayStr = formatDateStr(new Date());
  const selectedStr = formatDateStr(selectedDate);

  interface MonthCell {
    num: number;
    dateStr: string;
    muted: boolean;
    today: boolean;
    selected: boolean;
    dateObj: Date;
  }

  const cells: MonthCell[] = [];

  // Prev month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const num = daysInPrevMonth - i;
    const dObj = new Date(year, month - 1, num);
    const dateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`;
    cells.push({
      num,
      dateStr,
      muted: true,
      today: dateStr === todayStr,
      selected: dateStr === selectedStr,
      dateObj: dObj,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dObj = new Date(year, month, i);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    cells.push({
      num: i,
      dateStr,
      muted: false,
      today: dateStr === todayStr,
      selected: dateStr === selectedStr,
      dateObj: dObj,
    });
  }

  // Next month padding
  const remaining = 35 - cells.length;
  for (let i = 1; i <= (remaining < 0 ? remaining + 7 : remaining); i++) {
    const dObj = new Date(year, month + 1, i);
    const dateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    cells.push({
      num: i,
      dateStr,
      muted: true,
      today: dateStr === todayStr,
      selected: dateStr === selectedStr,
      dateObj: dObj,
    });
  }

  const handleCellClick = (cell: MonthCell) => {
    setSelectedDate(cell.dateObj);
  };

  const handlePillClick = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    openEventDetails(ev);
  };

  return (
    <div className="calendar-area fade-up fade-up-2">
      <div className="week-header">
        <div className="time-corner">GMT-8</div>
        {dayNames.map((d) => (
          <div key={d} className="day-header">
            <div className="day-name">{d}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridAutoRows: "1fr",
          minHeight: "600px",
          background: "var(--bg)",
        }}
      >
        {cells.map((cell, idx) => {
          const cellEvents = events.filter((e) => e.dateStr === cell.dateStr);

          return (
            <div
              key={idx}
              style={{
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                padding: "8px",
                background: cell.today
                  ? "rgba(212, 255, 61, 0.018)"
                  : cell.muted
                  ? "var(--bg-1)"
                  : "var(--bg)",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
              onClick={() => handleCellClick(cell)}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: cell.today ? 700 : 500,
                  fontFamily: "Space Grotesk, sans-serif",
                  color: cell.today
                    ? "var(--accent)"
                    : cell.muted
                    ? "var(--fg-3)"
                    : "var(--fg)",
                  marginBottom: "4px",
                }}
              >
                {cell.num}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  overflowY: "auto",
                  maxHeight: "80px",
                }}
              >
                {cellEvents.map((ev) => {
                  const isVisible = activeCategories[ev.cat];
                  const catColor = categoryColors[ev.cat] || "var(--accent)";

                  return (
                    <div
                      key={ev.id}
                      style={{
                        fontSize: "9.5px",
                        padding: "2px 4px",
                        background: "var(--bg-2)",
                        borderLeft: `2.5px solid ${catColor}`,
                        color: "var(--fg)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        opacity: isVisible ? 1 : 0.2,
                        borderRadius: "2px",
                      }}
                      title={`${ev.time} - ${ev.title}`}
                      onClick={(e) => handlePillClick(e, ev)}
                    >
                      {ev.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
