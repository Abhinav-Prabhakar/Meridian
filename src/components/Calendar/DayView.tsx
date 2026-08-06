"use client";

import React, { useEffect, useState } from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { useToast } from "@/context/ToastContext";
import { formatDateStr, getNowPosition } from "@/lib/dateUtils";

const hours = [
  "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM",
  "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM"
];

function formatHourMin(hourVal: number): string {
  const h = Math.floor(hourVal);
  const m = Math.round((hourVal - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildTimeRangeStr(startHour: number, durHours: number): string {
  return `${formatHourMin(startHour)} — ${formatHourMin(startHour + durHours)}`;
}

export const DayView: React.FC = () => {
  const { selectedDate, events, updateEvent, openEventDetails, openNewEventModal } = useCalendar();
  const { activeCategories } = useCalendarFilter();
  const { showToast } = useToast();

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

  // Drag and drop with 10-minute snapping
  const handleDragStart = (e: React.DragEvent, ev: CalendarEvent) => {
    e.dataTransfer.setData("text/plain", ev.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnColumn = (e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    const targetEvent = events.find((ev) => ev.id === eventId);
    if (!targetEvent) return;

    const columnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - columnRect.top;
    const snappedMinutes = Math.max(0, Math.min(13.83 * 60, Math.round(offsetY / 10) * 10));
    const newStart = 7 + snappedMinutes / 60;
    const newTimeStr = buildTimeRangeStr(newStart, targetEvent.dur);

    updateEvent(eventId, {
      ...targetEvent,
      dateStr,
      start: newStart,
      time: newTimeStr,
    });

    showToast(`Rescheduled "${targetEvent.title}" to ${formatHourMin(newStart)}`);
  };

  // Bottom handle resize handler (10-minute snapping)
  const handleResizeStart = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const initialDurMins = ev.dur * 60;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newMins = Math.max(10, Math.round((initialDurMins + deltaY) / 10) * 10);
      const newDurHours = newMins / 60;
      const newTimeStr = buildTimeRangeStr(ev.start, newDurHours);

      updateEvent(ev.id, {
        ...ev,
        dur: newDurHours,
        time: newTimeStr,
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      showToast(`Updated duration for "${ev.title}"`);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
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

        <div
          className="day-column today-col"
          style={{ borderRight: "none", position: "relative" }}
          onDragOver={handleDragOver}
          onDrop={handleDropOnColumn}
        >
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
            const isVisible = activeCategories[ev.cat] !== false;

            return (
              <div
                key={ev.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, ev)}
                className={`event cat-${ev.cat} ${compact ? "event-compact" : ""} ${
                  !isVisible ? "dimmed" : ""
                }`}
                style={{ top: `${top}px`, height: `${height}px`, position: "absolute" }}
                onClick={(e) => handleEventClick(e, ev)}
                title="Drag to reschedule (10 min snap), drag bottom handle to resize"
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

                {/* 10-Minute Resize Handle */}
                <div
                  className="event-resize-handle"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "8px",
                    cursor: "ns-resize",
                    background: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "0 0 4px 4px",
                  }}
                  onMouseDown={(e) => handleResizeStart(e, ev)}
                  title="Drag to extend/cut duration (10 min snap)"
                />
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
