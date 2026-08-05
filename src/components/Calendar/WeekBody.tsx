"use client";

import React from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { useToast } from "@/context/ToastContext";

const hours = [
  "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM",
  "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM"
];

export const WeekBody: React.FC = () => {
  const { selectedDate, events, deleteEvent, openNewEventModal } = useCalendar();
  const { activeCategories } = useCalendarFilter();
  const { showToast } = useToast();

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const todayObj = new Date(2024, 10, 20); // Nov 20, 2024 demo parity
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  const nowTop = (10 + 42 / 60 - 7) * 60; // 222px

  const handleEventClick = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    showToast(`Event: ${ev.title} (${ev.time})`);
  };

  const handleSlotClick = (dateStr: string, hourIndex: number) => {
    const startHour = 7 + hourIndex;
    openNewEventModal({ dateStr, startHour });
  };

  return (
    <div className="week-body" id="weekBody">
      <div className="time-column">
        {hours.map((h, i) => (
          <div key={i} className="hour-label">
            <span>{h}</span>
          </div>
        ))}
      </div>

      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
        const columnDate = new Date(monday);
        columnDate.setDate(columnDate.getDate() + dayIdx);

        const dateStr = `${columnDate.getFullYear()}-${String(columnDate.getMonth() + 1).padStart(2, "0")}-${String(columnDate.getDate()).padStart(2, "0")}`;
        const isToday = dateStr === todayStr;
        const dayEvents = events.filter((e) => e.dateStr === dateStr);

        return (
          <div
            key={dayIdx}
            className={`day-column ${isToday ? "today-col" : ""}`}
            data-day={dayIdx}
          >
            {Array.from({ length: 14 }).map((_, hIdx) => (
              <div
                key={hIdx}
                className="hour-line"
                style={{ cursor: "pointer" }}
                title={`Add event at ${hours[hIdx]}`}
                onClick={() => handleSlotClick(dateStr, hIdx)}
              ></div>
            ))}

            {dayEvents.map((ev) => {
              const top = (ev.start - 7) * 60;
              const height = ev.dur * 60 - 3;
              const compact = ev.dur <= 0.5;
              const isVisible = activeCategories[ev.cat];

              return (
                <div
                  key={ev.id}
                  className={`event cat-${ev.cat} ${compact ? "event-compact" : ""} ${
                    !isVisible ? "dimmed" : ""
                  }`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  onClick={(e) => handleEventClick(e, ev)}
                >
                  {compact ? (
                    <>
                      <div className="event-title">{ev.title}</div>
                      <div className="event-time">{ev.time.split(" — ")[0]}</div>
                    </>
                  ) : (
                    <>
                      <div className="event-time">{ev.time}</div>
                      <div className="event-title">{ev.title}</div>
                      <div className="event-meta">{ev.meta || ""}</div>
                      {ev.attendees && ev.attendees.length > 0 && (
                        <div className="event-attendees">
                          {ev.attendees.slice(0, 4).map((a, aIdx) => (
                            <div key={aIdx} className="event-attendee">
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Now line at 10:42 AM */}
      <div className="now-line" style={{ top: `${nowTop}px` }}></div>
    </div>
  );
};
