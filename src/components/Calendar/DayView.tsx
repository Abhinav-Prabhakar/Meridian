"use client";

import React, { useEffect, useState } from "react";
import { useCalendar, CalendarEvent } from "@/context/CalendarContext";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { useToast } from "@/context/ToastContext";
import {
  CALENDAR_MINUTES,
  CALENDAR_START_HOUR,
  formatDateStr,
  getCalendarHourLabels,
  getNowPosition,
  eventsForDate,
} from "@/lib/dateUtils";
import { TimeZoneLabel } from "./TimeZoneLabel";
import { AllDayRow } from "./AllDayRow";

const hours = getCalendarHourLabels();

function formatHourMin(hourVal: number): string {
  const h = Math.floor(hourVal);
  const m = Math.round((hourVal - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildTimeRangeStr(startHour: number, durHours: number): string {
  return `${formatHourMin(startHour)} — ${formatHourMin(startHour + durHours)}`;
}

interface CreateSession {
  pointerId: number;
  anchorMinutes: number;
  moved: boolean;
  preview: { start: number; dur: number };
  frame: number | null;
  onMove: (event: PointerEvent) => void;
  onUp: () => void;
  onCancel: () => void;
}

export const DayView: React.FC = () => {
  const { selectedDate, events, updateEvent, openEventDetails, openNewEventModal } = useCalendar();
  const { activeCategories } = useCalendarFilter();
  const { showToast } = useToast();

  const dateStr = formatDateStr(selectedDate);
  const dayEvents = eventsForDate(events, dateStr).filter((e) => !e.allDay);

  const fullDateTitle = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [nowTop, setNowTop] = useState<number | null>(null);
  const [createPreview, setCreatePreview] = useState<{ start: number; dur: number } | null>(null);
  const createSessionRef = React.useRef<CreateSession | null>(null);
  const suppressClickRef = React.useRef(false);
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
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    openNewEventModal({ dateStr, startHour: CALENDAR_START_HOUR + hIdx });
  };

  const finishCreateDrag = (commit: boolean) => {
    const session = createSessionRef.current;
    if (!session) return;
    window.removeEventListener("pointermove", session.onMove);
    window.removeEventListener("pointerup", session.onUp);
    window.removeEventListener("pointercancel", session.onCancel);
    if (session.frame !== null) cancelAnimationFrame(session.frame);

    if (commit && session.moved) {
      openNewEventModal({ dateStr, startHour: session.preview.start, dur: session.preview.dur });
      suppressClickRef.current = true;
    }
    createSessionRef.current = null;
    setCreatePreview(null);
  };

  const handleCreatePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || createSessionRef.current) return;
    e.preventDefault();
    const columnRect = e.currentTarget.getBoundingClientRect();
    const anchorMinutes = Math.max(
      0,
      Math.min(CALENDAR_MINUTES - 10, Math.round(((e.clientY - columnRect.top) / 60) * 6) * 10)
    );
    const initialPreview = { start: CALENDAR_START_HOUR + anchorMinutes / 60, dur: 1 / 6 };
    const session: CreateSession = {
      pointerId: e.pointerId,
      anchorMinutes,
      moved: false,
      preview: initialPreview,
      frame: null as number | null,
      onMove: () => {},
      onUp: () => {},
      onCancel: () => {},
    };
    const schedulePreview = (preview: { start: number; dur: number }) => {
      session.preview = preview;
      if (session.frame !== null) return;
      session.frame = requestAnimationFrame(() => {
        session.frame = null;
        if (createSessionRef.current === session) setCreatePreview(session.preview);
      });
    };
    session.onMove = (moveEvent) => {
      if (moveEvent.pointerId !== session.pointerId) return;
      const distance = Math.hypot(moveEvent.clientX - e.clientX, moveEvent.clientY - e.clientY);
      if (!session.moved && distance < 4) return;
      session.moved = true;
      const currentMinutes = Math.max(
        0,
        Math.min(CALENDAR_MINUTES, Math.round(((moveEvent.clientY - columnRect.top) / 60) * 6) * 10)
      );
      const startMinutes = Math.min(session.anchorMinutes, currentMinutes);
      const durationMinutes = Math.max(10, Math.abs(currentMinutes - session.anchorMinutes));
      schedulePreview({ start: CALENDAR_START_HOUR + startMinutes / 60, dur: durationMinutes / 60 });
    };
    session.onUp = () => finishCreateDrag(true);
    session.onCancel = () => finishCreateDrag(false);
    createSessionRef.current = session;
    setCreatePreview(initialPreview);
    window.addEventListener("pointermove", session.onMove);
    window.addEventListener("pointerup", session.onUp);
    window.addEventListener("pointercancel", session.onCancel);
  };

  useEffect(() => () => {
    const session = createSessionRef.current;
    if (!session) return;
    window.removeEventListener("pointermove", session.onMove);
    window.removeEventListener("pointerup", session.onUp);
    window.removeEventListener("pointercancel", session.onCancel);
    if (session.frame !== null) cancelAnimationFrame(session.frame);
  }, []);

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
    const maxStartMinutes = CALENDAR_MINUTES - targetEvent.dur * 60;
    const snappedMinutes = Math.max(0, Math.min(maxStartMinutes, Math.round(offsetY / 10) * 10));
    const newStart = CALENDAR_START_HOUR + snappedMinutes / 60;
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
      <AllDayRow singleDay />
      <div
        className="week-header"
        style={{
          gridTemplateColumns: "64px 1fr",
          padding: "12px 16px",
          alignItems: "center",
        }}
      >
        <TimeZoneLabel />
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
          onPointerDown={handleCreatePointerDown}
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
            const top = (ev.start - CALENDAR_START_HOUR) * 60;
            const height = ev.dur * 60 - 3;
            const compact = ev.dur <= 0.5;
            const isVisible = activeCategories[ev.cat] !== false;

            return (
              <div
                key={ev.id}
                onPointerDown={(e) => e.stopPropagation()}
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
                    background: "transparent",
                  }}
                  onMouseDown={(e) => handleResizeStart(e, ev)}
                  title="Drag bottom edge to resize duration (10 min snap)"
                />
              </div>
            );
          })}

          {createPreview && (
            <div
              className="event event-create-preview"
              style={{
                top: `${(createPreview.start - CALENDAR_START_HOUR) * 60}px`,
                height: `${Math.max(10, createPreview.dur * 60 - 3)}px`,
              }}
              aria-label={`New event, ${buildTimeRangeStr(createPreview.start, createPreview.dur)}`}
            >
              <span className="event-create-label">New event</span>
              <span className="event-time">{buildTimeRangeStr(createPreview.start, createPreview.dur)}</span>
            </div>
          )}
        </div>

        {/* Now line */}
        {isToday && nowTop !== null && <div className="now-line" style={{ top: `${nowTop}px`, left: "64px" }}></div>}
      </div>
    </div>
  );
};
