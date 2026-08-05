"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const WeekHeader: React.FC = () => {
  const { selectedDate, setSelectedDate } = useCalendar();

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const todayObj = new Date(2024, 10, 20); // Nov 20, 2024 demo parity

  const days = dayNames.map((name, i) => {
    const curr = new Date(monday);
    curr.setDate(curr.getDate() + i);

    const isToday =
      curr.getFullYear() === todayObj.getFullYear() &&
      curr.getMonth() === todayObj.getMonth() &&
      curr.getDate() === todayObj.getDate();

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
