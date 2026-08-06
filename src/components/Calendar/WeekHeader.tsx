"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";
import { formatDateStr } from "@/lib/dateUtils";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const WeekHeader: React.FC = () => {
  const { selectedDate, setSelectedDate } = useCalendar();

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const todayStr = formatDateStr(new Date());

  const days = dayNames.map((name, i) => {
    const curr = new Date(monday);
    curr.setDate(curr.getDate() + i);

    const isToday = formatDateStr(curr) === todayStr;

    return {
      name,
      number: curr.getDate(),
      dateObj: curr,
      today: isToday,
    };
  });

  return (
    <div className="week-header">
      <div className="time-corner">GMT-8</div>
      {days.map((d, i) => (
        <div
          key={i}
          className={`day-header ${d.today ? "today" : ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedDate(d.dateObj)}
        >
          <div className="day-name">{d.name}</div>
          <div className="day-number">{d.number}</div>
        </div>
      ))}
    </div>
  );
};
