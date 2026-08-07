"use client";

import React, { useState, useEffect } from "react";
import { EventInvitee, RecurrenceFrequency, useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";
import { CalendarCategory } from "@/context/CalendarFilterContext";
import { eventsForDate } from "@/lib/dateUtils";

export const NewEventModal: React.FC = () => {
  const {
    isNewEventOpen,
    closeNewEventModal,
    addEvent,
    updateEvent,
    saveEventExtras,
    events,
    newEventInitialData,
    selectedDate,
  } = useCalendar();
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
  const [allDay, setAllDay] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"none" | RecurrenceFrequency>("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([selectedDate.getDay()]);
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [travelMinutes, setTravelMinutes] = useState(0);
  const [invitees, setInvitees] = useState<Array<Pick<EventInvitee, "email" | "displayName">>>([]);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  const isEditing = Boolean(newEventInitialData?.id);

  useEffect(() => {
    if (isNewEventOpen) {
      if (newEventInitialData) {
        setDateStr(newEventInitialData.dateStr || formatDateStr(selectedDate));
        setStartHour(newEventInitialData.startHour ?? 10);
        setDur(newEventInitialData.dur ?? 1);
        setTitle(newEventInitialData.title || "");
        setMeta(newEventInitialData.meta || "");
        setCat(newEventInitialData.cat || "meeting");
        setAllDay(Boolean(newEventInitialData.allDay));
        setRecurrenceFrequency(newEventInitialData.recurrence?.frequency || "none");
        setRecurrenceInterval(newEventInitialData.recurrence?.interval || 1);
        setRecurrenceWeekdays(newEventInitialData.recurrence?.weekdays || [new Date(`${newEventInitialData.dateStr || formatDateStr(selectedDate)}T00:00:00`).getDay()]);
        setRecurrenceUntil(newEventInitialData.recurrence?.until || "");
        setReminderMinutes(newEventInitialData.alerts?.find((alert) => alert.kind === "reminder")?.minutesBefore ?? 15);
        setTravelMinutes(newEventInitialData.alerts?.find((alert) => alert.kind === "travel")?.travelMinutes ?? 0);
        setInvitees((newEventInitialData.invitees || []).map((invitee) => ({ email: invitee.email, displayName: invitee.displayName })));
      } else {
        setDateStr(formatDateStr(selectedDate));
        setStartHour(10);
        setTitle("");
        setMeta("");
        setCat("meeting");
        setDur(1);
        setAllDay(false);
        setRecurrenceFrequency("none");
        setRecurrenceInterval(1);
        setRecurrenceWeekdays([selectedDate.getDay()]);
        setRecurrenceUntil("");
        setReminderMinutes(15);
        setTravelMinutes(0);
        setInvitees([]);
      }
      setInviteeEmail("");
      setInviteeName("");
      setConflictAcknowledged(false);
    }
  }, [isNewEventOpen, newEventInitialData, selectedDate]);

  if (!isNewEventOpen) return null;

  const eventStart = allDay ? 0 : startHour;
  const eventDuration = allDay ? 24 : dur;
  const conflicts = eventsForDate(events, dateStr).filter((event) => {
    if (event.id === newEventInitialData?.id) return false;
    if (allDay || event.allDay) return true;
    return eventStart < event.start + event.dur && eventStart + eventDuration > event.start;
  });

  const handleAddInvitee = () => {
    const email = inviteeEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      showToast("Enter a valid invitee email");
      return;
    }
    if (invitees.some((invitee) => invitee.email === email)) {
      showToast("That invitee is already added");
      return;
    }
    setInvitees((current) => [...current, { email, displayName: inviteeName.trim() || undefined }]);
    setInviteeEmail("");
    setInviteeName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Please enter an event title");
      return;
    }

    if (conflicts.length > 0 && !conflictAcknowledged) {
      showToast(`${conflicts.length} scheduling conflict${conflicts.length === 1 ? "" : "s"} detected`);
      setConflictAcknowledged(true);
      return;
    }
    const startFormatted = `${String(Math.floor(eventStart)).padStart(2, "0")}:${eventStart % 1 === 0.5 ? "30" : "00"}`;
    const endH = eventStart + eventDuration;
    const endFormatted = `${String(Math.floor(endH)).padStart(2, "0")}:${endH % 1 === 0.5 ? "30" : "00"}`;
    const timeStr = allDay ? "All day" : `${startFormatted} — ${endFormatted}`;

    const eventPayload = {
      title: title.trim(),
      cat,
      dateStr,
      start: eventStart,
      dur: eventDuration,
      time: timeStr,
      allDay,
      meta: meta.trim() || undefined,
      recurrence: recurrenceFrequency === "none" ? undefined : {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        weekdays: recurrenceFrequency === "weekly" ? recurrenceWeekdays : undefined,
        until: recurrenceUntil || undefined,
      },
      attendees: invitees.map((invitee) => invitee.displayName || invitee.email),
    };

    const alerts = [
      { kind: "reminder" as const, minutesBefore: reminderMinutes },
      ...(travelMinutes > 0 ? [{ kind: "travel" as const, minutesBefore: travelMinutes, travelMinutes }] : []),
    ];

    if (isEditing && newEventInitialData?.id) {
      updateEvent(newEventInitialData.id, eventPayload);
      await saveEventExtras(newEventInitialData.id, { alerts, invitees });
      showToast(`Updated event: ${title.trim()}`);
    } else {
      const createdEvent = await addEvent(eventPayload);
      if (createdEvent) {
        await saveEventExtras(createdEvent.id, { alerts, invitees });
        showToast(`Event created: ${title.trim()}`);
      }
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

          <div className="event-form-section">
            <div className="form-label">Repeat</div>
            <div className="form-row">
              <select className="form-select" value={recurrenceFrequency} onChange={(e) => setRecurrenceFrequency(e.target.value as "none" | RecurrenceFrequency)}>
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Every weekday</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {recurrenceFrequency !== "none" && recurrenceFrequency !== "weekdays" ? (
                <input className="form-input" type="number" min={1} max={52} value={recurrenceInterval} onChange={(e) => setRecurrenceInterval(Math.max(1, Number(e.target.value) || 1))} aria-label="Repeat interval" />
              ) : <div />}
            </div>
            {recurrenceFrequency === "weekly" && (
              <div className="weekday-picker" aria-label="Repeat on weekdays">
                {[[1, "M"], [2, "T"], [3, "W"], [4, "T"], [5, "F"], [6, "S"], [0, "S"]].map(([value, label]) => (
                  <button type="button" key={value} className={`weekday-chip ${recurrenceWeekdays.includes(Number(value)) ? "active" : ""}`} onClick={() => setRecurrenceWeekdays((days) => days.includes(Number(value)) ? days.filter((day) => day !== Number(value)) : [...days, Number(value)])}>{label}</button>
                ))}
              </div>
            )}
            {recurrenceFrequency !== "none" && <input className="form-input" type="date" value={recurrenceUntil} onChange={(e) => setRecurrenceUntil(e.target.value)} aria-label="Repeat until" />}
          </div>

          <div className="event-form-section">
            <div className="form-label">Alerts</div>
            <div className="form-row">
              <select className="form-select" value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value))} aria-label="Reminder">
                <option value={0}>At time of event</option>
                <option value={5}>5 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>
              <input className="form-input" type="number" min={0} max={720} value={travelMinutes || ""} onChange={(e) => setTravelMinutes(Math.max(0, Number(e.target.value) || 0))} placeholder="Travel min" aria-label="Travel time in minutes" />
            </div>
            <div className="form-hint">Travel time sends a leave-now reminder before the event.</div>
          </div>

          <div className="event-form-section">
            <div className="form-label">Invitees</div>
            <div className="form-row">
              <input className="form-input" type="email" placeholder="name@company.com" value={inviteeEmail} onChange={(e) => setInviteeEmail(e.target.value)} />
              <input className="form-input" placeholder="Name (optional)" value={inviteeName} onChange={(e) => setInviteeName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddInvitee(); } }} />
            </div>
            <button type="button" className="btn-cancel add-invitee-btn" onClick={handleAddInvitee}>+ Add invitee</button>
            {invitees.length > 0 && <div className="invitee-draft-list">{invitees.map((invitee) => <div className="invitee-draft" key={invitee.email}><span>{invitee.displayName || invitee.email}</span><button type="button" onClick={() => setInvitees((current) => current.filter((item) => item.email !== invitee.email))}>Remove</button></div>)}</div>}
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
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>

          <label className="form-checkbox-row">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            <span>All-day event</span>
          </label>

          {!allDay && <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <select
                className="form-select"
                value={startHour}
                onChange={(e) => setStartHour(parseFloat(e.target.value))}
              >
                {Array.from({ length: 48 }, (_, index) => index / 2).map((h) => {
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
          </div>}

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

          {conflicts.length > 0 && conflictAcknowledged && <div className="conflict-warning"><strong>Conflict detected.</strong> Overlaps {conflicts.map((event) => event.title).join(", ")}. Submit again to save anyway.</div>}

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
