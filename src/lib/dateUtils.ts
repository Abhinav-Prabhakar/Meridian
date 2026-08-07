export function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfWeek(date: Date): Date {
  const monday = new Date(date);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - dayOfWeek);
  return monday;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const CALENDAR_START_HOUR = 0;
export const CALENDAR_HOURS = 24;
export const CALENDAR_MINUTES = CALENDAR_HOURS * 60;

export function getCalendarHourLabels(): string[] {
  return Array.from({ length: CALENDAR_HOURS }, (_, hour) => {
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${hour < 12 ? "AM" : "PM"}`;
  });
}

export function getNowPosition(now: Date = new Date()): number {
  const position = (now.getHours() + now.getMinutes() / 60) * 60;
  return Math.max(0, Math.min(CALENDAR_MINUTES, position));
}

export function getLocalTimeZoneLabel(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "longOffset" }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value || "UTC";
  } catch {
    return "UTC";
  }
}

type RecurrenceLike = {
  frequency: "daily" | "weekdays" | "weekly" | "monthly";
  interval: number;
  weekdays?: number[];
  until?: string;
  count?: number;
};

type EventLike = { dateStr: string; recurrence?: RecurrenceLike };

export function eventOccursOnDate(event: EventLike, dateStr: string): boolean {
  if (!event.recurrence) return event.dateStr === dateStr;
  if (dateStr < event.dateStr || (event.recurrence.until && dateStr > event.recurrence.until)) return false;

  const [baseYear, baseMonth, baseDay] = event.dateStr.split("-").map(Number);
  const [year, month, day] = dateStr.split("-").map(Number);
  const baseDate = new Date(baseYear, baseMonth - 1, baseDay);
  const date = new Date(year, month - 1, day);
  const dayDiff = Math.round((date.getTime() - baseDate.getTime()) / 86400000);
  const interval = Math.max(1, event.recurrence.interval || 1);
  let matches = false;
  switch (event.recurrence.frequency) {
    case "daily":
      matches = dayDiff % interval === 0;
      break;
    case "weekdays":
      matches = date.getDay() > 0 && date.getDay() < 6 && dayDiff >= 0;
      break;
    case "weekly": {
      const weekdays = event.recurrence.weekdays?.length ? event.recurrence.weekdays : [baseDate.getDay()];
      const weeksSinceBase = Math.floor(dayDiff / 7);
      matches = dayDiff >= 0 && weeksSinceBase % interval === 0 && weekdays.includes(date.getDay());
      break;
    }
    case "monthly": {
      const monthsSinceBase = (year - baseYear) * 12 + (month - baseMonth);
      matches = monthsSinceBase >= 0 && monthsSinceBase % interval === 0 && day === baseDay;
      break;
    }
    default:
      matches = false;
  }

  if (!matches || !event.recurrence.count) return matches;
  let occurrenceCount = 0;
  const cursor = new Date(baseDate);
  while (cursor <= date) {
    const cursorDate = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (eventOccursOnDate({ dateStr: event.dateStr, recurrence: { ...event.recurrence, count: undefined } }, cursorDate)) occurrenceCount += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return occurrenceCount <= event.recurrence.count;
}

export function eventsForDate<T extends EventLike>(events: T[], dateStr: string): T[] {
  return events
    .filter((event) => eventOccursOnDate(event, dateStr))
    .map((event) => ({ ...event, dateStr }));
}
