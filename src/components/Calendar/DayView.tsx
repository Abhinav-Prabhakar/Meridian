"use client";

import React, { useEffect, useState } from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { formatDateStr, getNowPosition } from "@/lib/dateUtils";

const hours = [
  "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM",
  "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM"
];

export const DayView: React.FC = () => {
  const { selectedDate, events, openEventDetails, openNewEventModal } = useCalendar();
  const { activeCategories } = useCalendarFilter();

  const dateStr = formatDateStr(selectedDate);
  const dayEvents = events.filter((e) => e.dateStr === dateStr);

  const fullDateTitle = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [nowTop, setNowTop] = useState(() => getNowPosition());
  const isToday = dateStr === formatDateStr(new Date());

  useEffect(() => {
    const updateNowPosition = () => setNowTop(getNowPosition());
    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleEventClick = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    openEventDetails(ev);
  };

  const handleSlotClick = (hIdx: number) => {
    openNewEventModal({ dateStr, startHour: 7 + hIdx });
  };

  return (
    <div className="calendar-area fade-up fade-up-2">
      <div
        className="week-header"
        style={{
          gridTemplateColumns: "64px 1fr",
          padding: "12px 16px",
          alignItems: "center",
        }}
      >
        <div className="time-corner">GMT-8</div>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "16px", fontWeight: 700 }}>
          {fullDateTitle}
        </div>
      </div>

      <div className="week-body" style={{ gridTemplateColumns: "64px 1fr" }}>
        <div className="time-column">
          {hours.map((h, i) => (
            <div key={i} className="hour-label">
              <span>{h}</span>
            </div>
          ))}
        </div>

        <div className="day-column today-col" style={{ borderRight: "none" }}>
          {Array.from({ length: 14 }).map((_, hIdx) => (
            <div
              key={hIdx}
              className="hour-line"
              style={{ cursor: "pointer" }}
              title={`Add event at ${hours[hIdx]}`}
              onClick={() => handleSlotClick(hIdx)}
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

        {/* Now line */}
        {isToday && <div className="now-line" style={{ top: `${nowTop}px`, left: "64px" }}></div>}
      </div>
    </div>
  );
};
