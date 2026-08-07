"use client";

import React, { useEffect, useRef, useState } from "react";
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

const hours = getCalendarHourLabels();

const dayAbbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatHourMin(hourVal: number): string {
  const h = Math.floor(hourVal);
  const m = Math.round((hourVal - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildTimeRangeStr(startHour: number, durHours: number): string {
  return `${formatHourMin(startHour)} — ${formatHourMin(startHour + durHours)}`;
}

interface DragPreview {
  id: string;
  dateStr: string;
  start: number;
}

interface CreatePreview {
  dateStr: string;
  start: number;
  dur: number;
}

interface CreateSession {
  pointerId: number;
  dateStr: string;
  anchorMinutes: number;
  moved: boolean;
  preview: CreatePreview;
  frame: number | null;
  onMove: (event: PointerEvent) => void;
  onUp: () => void;
  onCancel: () => void;
}

interface DragSession {
  event: CalendarEvent;
  pointerId: number;
  grabOffsetY: number;
  moved: boolean;
  preview: DragPreview;
  frame: number | null;
  onMove: (event: PointerEvent) => void;
  onUp: () => void;
  onCancel: () => void;
}

export const WeekBody: React.FC = () => {
  const { selectedDate, events, updateEvent, openEventDetails, openNewEventModal } = useCalendar();
  const { activeCategories } = useCalendarFilter();
  const { showToast } = useToast();
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [createPreview, setCreatePreview] = useState<CreatePreview | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const createSessionRef = useRef<CreateSession | null>(null);
  const suppressClickRef = useRef(false);

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const todayStr = formatDateStr(new Date());

  // Live real-time clock position ticker
  // Do not calculate this during SSR. Vercel renders in UTC while the browser
  // uses the user's local clock, which can briefly place NOW at the wrong hour.
  const [nowTop, setNowTop] = useState<number | null>(null);

  useEffect(() => {
    const updateNowPosition = () => setNowTop(getNowPosition(new Date()));
    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleEventClick = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    openEventDetails(ev);
  };

  const handleSlotClick = (dateStr: string, hourIndex: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const startHour = CALENDAR_START_HOUR + hourIndex;
    openNewEventModal({ dateStr, startHour });
  };

  const finishCreateDrag = (commit: boolean) => {
    const session = createSessionRef.current;
    if (!session) return;

    window.removeEventListener("pointermove", session.onMove);
    window.removeEventListener("pointerup", session.onUp);
    window.removeEventListener("pointercancel", session.onCancel);
    if (session.frame !== null) cancelAnimationFrame(session.frame);

    if (commit && session.moved) {
      openNewEventModal({
        dateStr: session.preview.dateStr,
        startHour: session.preview.start,
        dur: session.preview.dur,
      });
      suppressClickRef.current = true;
    }

    createSessionRef.current = null;
    setCreatePreview(null);
  };

  const handleCreatePointerDown = (e: React.PointerEvent<HTMLDivElement>, dateStr: string) => {
    if (e.button !== 0 || dragSessionRef.current || createSessionRef.current) return;

    e.preventDefault();
    const columnRect = e.currentTarget.getBoundingClientRect();
    const anchorMinutes = Math.max(
      0,
      Math.min(CALENDAR_MINUTES - 10, Math.round(((e.clientY - columnRect.top) / 60) * 6) * 10)
    );
    const initialPreview = { dateStr, start: CALENDAR_START_HOUR + anchorMinutes / 60, dur: 1 / 6 };
    const session: CreateSession = {
      pointerId: e.pointerId,
      dateStr,
      anchorMinutes,
      moved: false,
      preview: initialPreview,
      frame: null,
      onMove: () => {},
      onUp: () => {},
      onCancel: () => {},
    };

    const schedulePreview = (preview: CreatePreview) => {
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

      const pointTarget = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const targetColumn = pointTarget?.closest<HTMLElement>(".day-column");
      if (!targetColumn?.dataset.date) return;
      const columnRect = targetColumn.getBoundingClientRect();
      const currentMinutes = Math.max(
        0,
        Math.min(CALENDAR_MINUTES, Math.round(((moveEvent.clientY - columnRect.top) / 60) * 6) * 10)
      );
      const startMinutes = Math.min(session.anchorMinutes, currentMinutes);
      const durationMinutes = Math.max(10, Math.abs(currentMinutes - session.anchorMinutes));
      schedulePreview({
        dateStr: targetColumn.dataset.date,
        start: CALENDAR_START_HOUR + startMinutes / 60,
        dur: durationMinutes / 60,
      });
    };

    session.onUp = () => finishCreateDrag(true);
    session.onCancel = () => finishCreateDrag(false);
    createSessionRef.current = session;
    setCreatePreview(initialPreview);
    window.addEventListener("pointermove", session.onMove);
    window.addEventListener("pointerup", session.onUp);
    window.addEventListener("pointercancel", session.onCancel);
  };

  const finishPointerDrag = (commit: boolean) => {
    const session = dragSessionRef.current;
    if (!session) return;

    window.removeEventListener("pointermove", session.onMove);
    window.removeEventListener("pointerup", session.onUp);
    window.removeEventListener("pointercancel", session.onCancel);
    if (session.frame !== null) cancelAnimationFrame(session.frame);

    if (commit && session.moved) {
      const { event } = session;
      const { dateStr, start } = session.preview;
      const changed = event.dateStr !== dateStr || event.start !== start;

      if (changed) {
        updateEvent(event.id, {
          ...event,
          dateStr,
          start,
          time: buildTimeRangeStr(start, event.dur),
        });

        const [year, month, day] = dateStr.split("-").map(Number);
        const dropDate = new Date(year, month - 1, day);
        const dayName = dayAbbrs[(dropDate.getDay() + 6) % 7];
        showToast(`Rescheduled "${event.title}" to ${dayName} at ${formatHourMin(start)}`);
      }
    }

    if (session.moved) suppressClickRef.current = true;
    dragSessionRef.current = null;
    setDragPreview(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, ev: CalendarEvent) => {
    e.stopPropagation();
    if (e.button !== 0 || dragSessionRef.current) return;
    if ((e.target as HTMLElement).closest(".event-resize-handle")) return;

    e.preventDefault();
    suppressClickRef.current = false;
    const eventRect = e.currentTarget.getBoundingClientRect();
    const initialPreview: DragPreview = {
      id: ev.id,
      dateStr: ev.dateStr,
      start: ev.start,
    };

    const session: DragSession = {
      event: ev,
      pointerId: e.pointerId,
      grabOffsetY: e.clientY - eventRect.top,
      moved: false,
      preview: initialPreview,
      frame: null,
      onMove: () => {},
      onUp: () => {},
      onCancel: () => {},
    };

    const schedulePreview = (preview: DragPreview) => {
      session.preview = preview;
      if (session.frame !== null) return;

      session.frame = requestAnimationFrame(() => {
        session.frame = null;
        if (dragSessionRef.current === session) setDragPreview(session.preview);
      });
    };

    session.onMove = (moveEvent) => {
      if (moveEvent.pointerId !== session.pointerId) return;

      const distance = Math.hypot(moveEvent.clientX - e.clientX, moveEvent.clientY - e.clientY);
      if (!session.moved && distance < 4) return;
      session.moved = true;

      const pointTarget = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const targetColumn = pointTarget?.closest<HTMLElement>(".day-column");
      if (!targetColumn?.dataset.date) return;

      const columnRect = targetColumn.getBoundingClientRect();
      const durationMinutes = ev.dur * 60;
      const pointerOffsetMinutes = moveEvent.clientY - columnRect.top - session.grabOffsetY;
      const maxStartMinutes = CALENDAR_MINUTES - durationMinutes;
      const snappedMinutes = Math.max(
        0,
        Math.min(maxStartMinutes, Math.round(pointerOffsetMinutes / 10) * 10)
      );

      schedulePreview({
        id: ev.id,
        dateStr: targetColumn.dataset.date,
        start: CALENDAR_START_HOUR + snappedMinutes / 60,
      });
    };

    session.onUp = () => finishPointerDrag(true);
    session.onCancel = () => finishPointerDrag(false);
    dragSessionRef.current = session;
    setDragPreview(initialPreview);

    window.addEventListener("pointermove", session.onMove);
    window.addEventListener("pointerup", session.onUp);
    window.addEventListener("pointercancel", session.onCancel);
  };

  useEffect(() => () => {
    const session = dragSessionRef.current;
    if (session) {
      window.removeEventListener("pointermove", session.onMove);
      window.removeEventListener("pointerup", session.onUp);
      window.removeEventListener("pointercancel", session.onCancel);
      if (session.frame !== null) cancelAnimationFrame(session.frame);
    }
    const createSession = createSessionRef.current;
    if (!createSession) return;
    window.removeEventListener("pointermove", createSession.onMove);
    window.removeEventListener("pointerup", createSession.onUp);
    window.removeEventListener("pointercancel", createSession.onCancel);
    if (createSession.frame !== null) cancelAnimationFrame(createSession.frame);
  }, []);

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

        const dateStr = formatDateStr(columnDate);
        const isToday = dateStr === todayStr;
        const dayEvents = eventsForDate(events, dateStr).filter((event) =>
          !event.allDay && (dragPreview?.id === event.id ? dragPreview.dateStr === dateStr : true)
        );

        return (
          <div
            key={dayIdx}
            className={`day-column ${isToday ? "today-col" : ""}`}
            data-day={dayIdx}
            data-date={dateStr}
            onPointerDown={(e) => handleCreatePointerDown(e, dateStr)}
          >
            {Array.from({ length: 14 }).map((_, hIdx) => (
              <div
                key={hIdx}
                className="hour-line"
                style={{ cursor: "pointer" }}
                title={`Click to add event (${hours[hIdx]})`}
                onClick={() => handleSlotClick(dateStr, hIdx)}
              ></div>
            ))}

            {dayEvents.map((ev) => {
              const isDragging = dragPreview?.id === ev.id;
              const eventStart = isDragging ? dragPreview.start : ev.start;
              const top = (eventStart - CALENDAR_START_HOUR) * 60;
              const height = ev.dur * 60 - 3;
              const compact = ev.dur <= 0.5;
              const isVisible = activeCategories[ev.cat] !== false;

              return (
                <div
                  key={ev.id}
                  onPointerDown={(e) => handlePointerDown(e, ev)}
                  className={`event cat-${ev.cat} ${compact ? "event-compact" : ""} ${
                    !isVisible ? "dimmed" : ""
                  } ${isDragging ? "is-dragging" : ""}`}
                  style={{ top: `${top}px`, height: `${height}px`, position: "absolute", touchAction: "none" }}
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
          </div>
        );
      })}

      {createPreview && (() => {
        const previewColumn = Array.from({ length: 7 }, (_, dayIdx) => {
          const date = new Date(monday);
          date.setDate(date.getDate() + dayIdx);
          return formatDateStr(date);
        }).indexOf(createPreview.dateStr);
        if (previewColumn < 0) return null;
        return (
          <div
            className="event event-create-preview"
            style={{
              top: `${(createPreview.start - CALENDAR_START_HOUR) * 60}px`,
              height: `${Math.max(10, createPreview.dur * 60 - 3)}px`,
              left: `calc(64px + (100% - 64px) / 7 * ${previewColumn} + 4px)`,
              right: "auto",
              width: "calc((100% - 64px) / 7 - 8px)",
            }}
            aria-label={`New event, ${buildTimeRangeStr(createPreview.start, createPreview.dur)}`}
          >
            <span className="event-create-label">New event</span>
            <span className="event-time">{buildTimeRangeStr(createPreview.start, createPreview.dur)}</span>
          </div>
        );
      })()}

      {/* Now line at current live time */}
      {nowTop !== null && <div className="now-line" style={{ top: `${nowTop}px` }}></div>}
    </div>
  );
};
