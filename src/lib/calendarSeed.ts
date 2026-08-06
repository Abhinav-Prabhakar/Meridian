import { addDays, formatDateStr, startOfWeek } from "./dateUtils";

export interface SeedCalendarEvent {
  id: string;
  dateStr: string;
  start: number;
  dur: number;
  title: string;
  cat: "meeting" | "focus" | "personal" | "strategy";
  time: string;
  meta?: string;
  attendees?: string[];
}

type SeedTemplate = Omit<SeedCalendarEvent, "dateStr"> & { dayOffset: number };

const seedTemplates: SeedTemplate[] = [
  { id: "1", dayOffset: 0, start: 9, dur: 1, title: "Q4 Strategy Review", cat: "strategy", time: "09:00 — 10:00", meta: "Conf Room A · 6 people", attendees: ["SC", "MR", "JD", "KP", "TB", "+2"] },
  { id: "2", dayOffset: 0, start: 11, dur: 0.5, title: "Daily Standup", cat: "meeting", time: "11:00 — 11:30", meta: "Engineering" },
  { id: "3", dayOffset: 0, start: 14, dur: 1, title: "Design Review", cat: "focus", time: "14:00 — 15:00", meta: "with Sarah Chen" },
  { id: "4", dayOffset: 0, start: 16, dur: 1.5, title: "Sprint Planning", cat: "meeting", time: "16:00 — 17:30", meta: "Product · 8 people" },
  { id: "5", dayOffset: 1, start: 8.5, dur: 1, title: "1:1 with Marcus", cat: "meeting", time: "08:30 — 09:30", meta: "Bi-weekly sync" },
  { id: "6", dayOffset: 1, start: 10, dur: 2, title: "Investor Sync — Series B", cat: "strategy", time: "10:00 — 12:00", meta: "Sequoia · 4 people" },
  { id: "7", dayOffset: 1, start: 13, dur: 1, title: "Product Workshop", cat: "focus", time: "13:00 — 14:00", meta: "Q1 Roadmap" },
  { id: "8", dayOffset: 1, start: 15.5, dur: 1, title: "Customer Interview", cat: "meeting", time: "15:30 — 16:30", meta: "Acme · Discovery" },
  { id: "9", dayOffset: 2, start: 9, dur: 0.5, title: "Daily Standup", cat: "meeting", time: "09:00 — 09:30", meta: "Engineering" },
  { id: "10", dayOffset: 2, start: 10.5, dur: 1.5, title: "User Research Debrief", cat: "focus", time: "10:30 — 12:00", meta: "Research · 5 people", attendees: ["EM", "JK", "PT", "LR", "+1"] },
  { id: "11", dayOffset: 2, start: 13, dur: 1, title: "Lunch with Elena", cat: "personal", time: "13:00 — 14:00", meta: "Cafe Rouge" },
  { id: "12", dayOffset: 2, start: 15, dur: 1, title: "Architecture Review", cat: "focus", time: "15:00 — 16:00", meta: "Platform · 6 people", attendees: ["SC", "MR", "JD", "+3"] },
  { id: "13", dayOffset: 2, start: 16, dur: 0.5, title: "1:1 with Priya", cat: "meeting", time: "16:00 — 16:30", meta: "Weekly sync" },
  { id: "14", dayOffset: 2, start: 17, dur: 1, title: "Team Happy Hour", cat: "personal", time: "17:00 — 18:00", meta: "The Rooftop" },
  { id: "15", dayOffset: 3, start: 9, dur: 1, title: "Coffee with David", cat: "personal", time: "09:00 — 10:00", meta: "Blue Bottle" },
  { id: "16", dayOffset: 3, start: 11, dur: 1, title: "Q4 Budget Planning", cat: "strategy", time: "11:00 — 12:00", meta: "CFO Office" },
  { id: "17", dayOffset: 3, start: 14, dur: 1.5, title: "Customer Demo — Acme", cat: "meeting", time: "14:00 — 15:30", meta: "Zoom · 12 people" },
  { id: "18", dayOffset: 3, start: 16, dur: 1, title: "1:1 with Priya Shah", cat: "meeting", time: "16:00 — 17:00", meta: "Weekly sync" },
  { id: "19", dayOffset: 4, start: 9, dur: 1, title: "Weekly Review", cat: "strategy", time: "09:00 — 10:00", meta: "Leadership · 6 people" },
  { id: "20", dayOffset: 4, start: 11, dur: 1.5, title: "Roadmap Workshop", cat: "focus", time: "11:00 — 12:30", meta: "Product + Eng" },
  { id: "21", dayOffset: 4, start: 14, dur: 1, title: "All-hands Meeting", cat: "meeting", time: "14:00 — 15:00", meta: "Company-wide" },
  { id: "22", dayOffset: 5, start: 10, dur: 2, title: "Brunch + Run", cat: "personal", time: "10:00 — 12:00", meta: "Marina Side" },
];

export function createCurrentWeekSeedEvents(referenceDate: Date = new Date()): SeedCalendarEvent[] {
  const monday = startOfWeek(referenceDate);
  return seedTemplates.map(({ dayOffset, ...event }) => ({
    ...event,
    dateStr: formatDateStr(addDays(monday, dayOffset)),
  }));
}
