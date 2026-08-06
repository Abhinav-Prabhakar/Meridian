"use client";

import React from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { startOfWeek } from "@/lib/dateUtils";

interface AllDayRowProps {
  singleDay?: boolean;
}

export const AllDayRow: React.FC<AllDayRowProps> = ({ singleDay = false }) => {
  const { selectedDate, events, openEventDetails } = useCalendar();
  const monday = startOfWeek(selectedDate);
  const dates = Array.from({ length: singleDay ? 1 : 7 }, (_, dayIndex) => {
    const date = new Date(singleDay ? selectedDate : monday);
    if (!singleDay) date.setDate(date.getDate() + dayIndex);
    return date;
  });

  const eventsByDate = new Map<string, CalendarEvent[]>();
  events
    .filter((event) => event.allDay)
    .forEach((event) => {
      const dayEvents = eventsByDate.get(event.dateStr) || [];
      dayEvents.push(event);
      eventsByDate.set(event.dateStr, dayEvents);
    });

  return (
    <div className={`allday-row ${singleDay ? "allday-row-single" : ""}`}>
      <div className="allday-label">All day</div>
      {dates.map((date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        return (
          <div className="allday-cell" key={date.toISOString()}>
            {(eventsByDate.get(dateStr) || []).map((event) => (
              <button
                className="allday-event"
                key={event.id}
                type="button"
                onClick={() => openEventDetails(event)}
                title={`Open ${event.title}`}
              >
                {event.title}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
};
