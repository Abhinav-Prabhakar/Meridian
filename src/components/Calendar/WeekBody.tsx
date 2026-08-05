"use client";

import React, { useState, useEffect } from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { useToast } from "@/context/ToastContext";

const hours = [
  "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM",
  "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM"
];

const dayAbbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const WeekBody: React.FC = () => {
  const { selectedDate, events, updateEvent, openEventDetails, openNewEventModal } = useCalendar();
  const { activeCategories } = useCalendarFilter();
  const { showToast } = useToast();

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const todayObj = new Date(2024, 10, 20); // Nov 20, 2024 demo parity
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  // Live real-time clock position ticker
  const [nowTop, setNowTop] = useState<number>(() => (10 + 42 / 60 - 7) * 60);

  useEffect(() => {
    const updateNowPosition = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h >= 7 && h <= 20) {
        setNowTop((h + m / 60 - 7) * 60);
      }
    };
    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleEventClick = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    openEventDetails(ev);
  };

  const handleSlotClick = (dateStr: string, hourIndex: number) => {
    const startHour = 7 + hourIndex;
    openNewEventModal({ dateStr, startHour });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, ev: CalendarEvent) => {
    e.dataTransfer.setData("text/plain", ev.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string, hourIndex: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    const targetEvent = events.find((ev) => ev.id === eventId);
    if (!targetEvent) return;

    const newStart = 7 + hourIndex;
    const startFormatted = `${String(Math.floor(newStart)).padStart(2, "0")}:${newStart % 1 === 0.5 ? "30" : "00"}`;
    const endH = newStart + targetEvent.dur;
    const endFormatted = `${String(Math.floor(endH)).padStart(2, "0")}:${endH % 1 === 0.5 ? "30" : "00"}`;
    const newTimeStr = `${startFormatted} — ${endFormatted}`;

    updateEvent(eventId, {
      ...targetEvent,
      dateStr: targetDateStr,
      start: newStart,
      time: newTimeStr,
    });

    const [y, m, d] = targetDateStr.split("-").map(Number);
    const dropDate = new Date(y, m - 1, d);
    const dayName = dayAbbrs[(dropDate.getDay() + 6) % 7];

    showToast(`Rescheduled "${targetEvent.title}" to ${dayName} at ${hours[hourIndex]}`);
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
                title={`Click to add event or drag event here (${hours[hIdx]})`}
                onClick={() => handleSlotClick(dateStr, hIdx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateStr, hIdx)}
              ></div>
            ))}

            {dayEvents.map((ev) => {
              const top = (ev.start - 7) * 60;
              const height = ev.dur * 60 - 3;
              const compact = ev.dur <= 0.5;
              const isVisible = activeCategories[ev.cat] !== false;

              return (
                <div
                  key={ev.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, ev)}
                  className={`event cat-${ev.cat} ${compact ? "event-compact" : ""} ${
                    !isVisible ? "dimmed" : ""
                  }`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  onClick={(e) => handleEventClick(e, ev)}
                  title="Drag to reschedule"
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

      {/* Now line at current live time */}
      <div className="now-line" style={{ top: `${nowTop}px` }}></div>
    </div>
  );
};
