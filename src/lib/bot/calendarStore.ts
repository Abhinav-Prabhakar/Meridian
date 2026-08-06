import { CalendarStoreEvent } from "./types";

// Server-side in-memory event store with seed defaults matching initial context
let globalEvents: CalendarStoreEvent[] = [
  // Monday Nov 18, 2024
  { id: "1", dateStr: "2024-11-18", start: 9, dur: 1, title: "Q4 Strategy Review", cat: "strategy", time: "09:00 — 10:00", meta: "Conf Room A · 6 people", attendees: ["SC", "MR", "JD", "KP", "TB"] },
  { id: "2", dateStr: "2024-11-18", start: 11, dur: 0.5, title: "Daily Standup", cat: "meeting", time: "11:00 — 11:30", meta: "Engineering" },
  { id: "3", dateStr: "2024-11-18", start: 14, dur: 1, title: "Design Review", cat: "focus", time: "14:00 — 15:00", meta: "with Sarah Chen" },
  { id: "4", dateStr: "2024-11-18", start: 16, dur: 1.5, title: "Sprint Planning", cat: "meeting", time: "16:00 — 17:30", meta: "Product · 8 people" },

  // Tuesday Nov 19, 2024
  { id: "5", dateStr: "2024-11-19", start: 8.5, dur: 1, title: "1:1 with Marcus", cat: "meeting", time: "08:30 — 09:30", meta: "Bi-weekly sync" },
  { id: "6", dateStr: "2024-11-19", start: 10, dur: 2, title: "Investor Sync — Series B", cat: "strategy", time: "10:00 — 12:00", meta: "Sequoia · 4 people" },
  { id: "7", dateStr: "2024-11-19", start: 13, dur: 1, title: "Product Workshop", cat: "focus", time: "13:00 — 14:00", meta: "Q1 Roadmap" },

  // Wednesday Nov 20, 2024 (Default Demo Date)
  { id: "9", dateStr: "2024-11-20", start: 9, dur: 0.5, title: "Daily Standup", cat: "meeting", time: "09:00 — 09:30", meta: "Engineering" },
  { id: "10", dateStr: "2024-11-20", start: 10.5, dur: 1.5, title: "User Research Debrief", cat: "focus", time: "10:30 — 12:00", meta: "Research · 5 people" },
  { id: "11", dateStr: "2024-11-20", start: 13, dur: 1, title: "Lunch with Elena", cat: "personal", time: "13:00 — 14:00", meta: "Cafe Rouge" },
  { id: "12", dateStr: "2024-11-20", start: 15, dur: 1, title: "Architecture Review", cat: "focus", time: "15:00 — 16:00", meta: "Platform · 6 people" },
  { id: "13", dateStr: "2024-11-20", start: 16, dur: 0.5, title: "1:1 with Priya", cat: "meeting", time: "16:00 — 16:30", meta: "Weekly sync" },

  // Thursday Nov 21, 2024
  { id: "15", dateStr: "2024-11-21", start: 9, dur: 1, title: "Coffee with David", cat: "personal", time: "09:00 — 10:00", meta: "Blue Bottle" },
  { id: "16", dateStr: "2024-11-21", start: 11, dur: 1, title: "Q4 Budget Planning", cat: "strategy", time: "11:00 — 12:00", meta: "CFO Office" },

  // Friday Nov 22, 2024
  { id: "19", dateStr: "2024-11-22", start: 9, dur: 1, title: "Weekly Review", cat: "strategy", time: "09:00 — 10:00", meta: "Leadership" },
  { id: "21", dateStr: "2024-11-22", start: 14, dur: 1, title: "All-hands Meeting", cat: "meeting", time: "14:00 — 15:00", meta: "Company-wide" },
];

export function getCalendarEvents(dateStr?: string): CalendarStoreEvent[] {
  if (dateStr) {
    return globalEvents.filter((ev) => ev.dateStr === dateStr);
  }
  return globalEvents;
}

export function syncCalendarEvents(events: CalendarStoreEvent[]): void {
  if (Array.isArray(events) && events.length > 0) {
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
