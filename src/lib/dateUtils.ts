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
