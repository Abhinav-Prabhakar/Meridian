"use client";

import React, { useState, useEffect } from "react";
import { useCalendar, EventPriority } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";
import { CalendarCategory } from "@/context/CalendarFilterContext";

export const NewEventModal: React.FC = () => {
  const { isNewEventOpen, closeNewEventModal, addEvent, updateEvent, newEventInitialData, selectedDate } = useCalendar();
  const { showToast } = useToast();

  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<CalendarCategory>("meeting");
  const [dateStr, setDateStr] = useState(formatDateStr(selectedDate));
  const [startHour, setStartHour] = useState(9);
  const [dur, setDur] = useState(1);
  const [meta, setMeta] = useState("");
  const [priority, setPriority] = useState<EventPriority>("normal");

  const isEditing = Boolean(newEventInitialData?.id);

  useEffect(() => {
    if (isNewEventOpen) {
      if (newEventInitialData) {
        if (newEventInitialData.dateStr) setDateStr(newEventInitialData.dateStr);
        if (newEventInitialData.startHour !== undefined) setStartHour(newEventInitialData.startHour);
        if (newEventInitialData.dur !== undefined) setDur(newEventInitialData.dur);
        if (newEventInitialData.title) setTitle(newEventInitialData.title);
        if (newEventInitialData.cat) setCat(newEventInitialData.cat);
        if (newEventInitialData.meta) setMeta(newEventInitialData.meta);
        if (newEventInitialData.priority) setPriority(newEventInitialData.priority);
      } else {
        setDateStr(formatDateStr(selectedDate));
        setStartHour(10);
        setTitle("");
        setMeta("");
        setCat("meeting");
        setDur(1);
        setPriority("normal");
      }
    }
  }, [isNewEventOpen, newEventInitialData, selectedDate]);

  if (!isNewEventOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Please enter an event title");
      return;
    }

    const startFormatted = `${String(Math.floor(startHour)).padStart(2, "0")}:${startHour % 1 === 0.5 ? "30" : "00"}`;
    const endH = startHour + dur;
    const endFormatted = `${String(Math.floor(endH)).padStart(2, "0")}:${endH % 1 === 0.5 ? "30" : "00"}`;
    const timeStr = `${startFormatted} — ${endFormatted}`;

    const eventPayload = {
      title: title.trim(),
      cat,
      dateStr,
      start: startHour,
      dur,
      time: timeStr,
      meta: meta.trim() || undefined,
      priority,
    };

    if (isEditing && newEventInitialData?.id) {
      updateEvent(newEventInitialData.id, eventPayload);
      showToast(`Updated event: ${title.trim()}`);
    } else {
      addEvent(eventPayload);
      showToast(`Event created: ${title.trim()}`);
    }

    closeNewEventModal();
  };

  return (
    <div className="modal-overlay" onClick={closeNewEventModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Edit Event" : "New Event"}</h2>
          <button className="modal-close" onClick={closeNewEventModal}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Design Review, 1:1 Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={cat}
                onChange={(e) => setCat(e.target.value as CalendarCategory)}
              >
                <option value="strategy">Strategy (Accent)</option>
                <option value="meeting">Meeting (Orange)</option>
                <option value="focus">Focus Time (Cyan)</option>
                <option value="personal">Personal (Pink)</option>
                <option value="travel">Travel (Yellow)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as EventPriority)}
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time</label>
              <select
                className="form-select"
                value={startHour}
                onChange={(e) => setStartHour(parseFloat(e.target.value))}
              >
                {[7, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14, 15, 16, 17, 18, 19].map((h) => {
                  const labelH = Math.floor(h);
                  const mins = h % 1 === 0.5 ? "30" : "00";
                  const ampm = labelH >= 12 ? "PM" : "AM";
                  const displayH = labelH > 12 ? labelH - 12 : labelH;
                  return (
                    <option key={h} value={h}>
                      {displayH}:{mins} {ampm}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Duration</label>
            <select
              className="form-select"
              value={dur}
              onChange={(e) => setDur(parseFloat(e.target.value))}
            >
              <option value={0.5}>30 minutes</option>
              <option value={1}>1 hour</option>
              <option value={1.5}>1.5 hours</option>
              <option value={2}>2 hours</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location / Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Zoom, Conf Room A"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={closeNewEventModal}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {isEditing ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
