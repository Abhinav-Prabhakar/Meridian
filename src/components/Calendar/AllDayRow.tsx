"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";
import { startOfWeek } from "@/lib/dateUtils";

export const AllDayRow: React.FC = () => {
  const { selectedDate } = useCalendar();
  const monday = startOfWeek(selectedDate);
  const allDayLabels: Record<number, string> = {
    1: "Marcus OOO (AM)",
    4: "Company Off-site",
  };

  return (
    <div className="allday-row">
      <div className="allday-label">All day</div>
      {Array.from({ length: 7 }).map((_, dayIndex) => {
        const date = new Date(monday);
        date.setDate(date.getDate() + dayIndex);
        return (
          <div className="allday-cell" key={date.toISOString()}>
            {allDayLabels[dayIndex] && <div className="allday-event">{allDayLabels[dayIndex]}</div>}
          </div>
        );
      })}
    </div>
  );
};
