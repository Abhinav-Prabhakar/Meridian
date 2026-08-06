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

export function getNowPosition(now: Date = new Date()): number {
  const position = (now.getHours() + now.getMinutes() / 60 - 7) * 60;
  return Math.max(0, Math.min(14 * 60, position));
}
