import { CalendarStoreEvent } from "./types";

// The web client syncs the authenticated user's Supabase events before using
// the bot. Keep this process-local store empty until that happens.
let globalEvents: CalendarStoreEvent[] = [];

export function getCalendarEvents(dateStr?: string): CalendarStoreEvent[] {
  if (dateStr) {
    return globalEvents.filter((ev) => ev.dateStr === dateStr);
  }
  return globalEvents;
}

export function syncCalendarEvents(events: CalendarStoreEvent[]): void {
  if (Array.isArray(events)) {
    globalEvents = [...events];
  }
}

export function formatTimeRange(startHour: number, durHours: number): string {
  const formatHour = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    const paddedMins = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${paddedHours}:${paddedMins}`;
  };
  return `${formatHour(startHour)} — ${formatHour(startHour + durHours)}`;
}

export function addCalendarEvent(data: {
  title: string;
  dateStr: string;
  startHour: number;
  durHours?: number;
  cat?: CalendarStoreEvent["cat"];
  meta?: string;
  attendees?: string[];
}): CalendarStoreEvent {
  const dur = data.durHours ?? 1;
  const time = formatTimeRange(data.startHour, dur);
  const newEvent: CalendarStoreEvent = {
    id: Date.now().toString(),
    dateStr: data.dateStr,
    start: data.startHour,
    dur,
    title: data.title,
    cat: data.cat || "meeting",
    time,
    meta: data.meta || "Added via Caspian Bot",
    attendees: data.attendees || ["Bot", "You"],
  };
  globalEvents.push(newEvent);
  return newEvent;
}

export function deleteCalendarEvent(target: string): CalendarStoreEvent | null {
  const idx = globalEvents.findIndex(
    (ev) => ev.id === target || ev.title.toLowerCase().includes(target.toLowerCase())
  );
  if (idx !== -1) {
    const deleted = globalEvents[idx];
    globalEvents.splice(idx, 1);
    return deleted;
  }
  return null;
}

export function editCalendarEvent(
  target: string,
  updates: Partial<Omit<CalendarStoreEvent, "id">> & { newTitle?: string; startHour?: number; durHours?: number }
): CalendarStoreEvent | null {
  const idx = globalEvents.findIndex(
    (ev) => ev.id === target || ev.title.toLowerCase().includes(target.toLowerCase())
  );

  if (idx === -1) return null;

  const current = globalEvents[idx];
  const newTitle = updates.newTitle || updates.title || current.title;
  const startHour = updates.startHour !== undefined ? updates.startHour : current.start;
  const durHours = updates.durHours !== undefined ? updates.durHours : current.dur;
  const time = formatTimeRange(startHour, durHours);

  const updatedEvent: CalendarStoreEvent = {
    ...current,
    title: newTitle,
    dateStr: updates.dateStr || current.dateStr,
    start: startHour,
    dur: durHours,
    cat: updates.cat || current.cat,
    time,
    meta: updates.meta || current.meta,
  };

  globalEvents[idx] = updatedEvent;
  return updatedEvent;
}

export function checkFreeSlots(dateStr: string): string[] {
  const dayEvents = getCalendarEvents(dateStr);
  const workingHoursStart = 8;
  const workingHoursEnd = 18;
  const freeSlots: string[] = [];

  let current = workingHoursStart;
  const sorted = [...dayEvents].sort((a, b) => a.start - b.start);

  for (const ev of sorted) {
    if (ev.start > current) {
      freeSlots.push(formatTimeRange(current, ev.start - current));
    }
    current = Math.max(current, ev.start + ev.dur);
  }

  if (current < workingHoursEnd) {
    freeSlots.push(formatTimeRange(current, workingHoursEnd - current));
  }

  return freeSlots;
}
