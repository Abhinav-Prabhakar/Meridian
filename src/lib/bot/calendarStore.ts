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

import { supabase } from "@/lib/supabase/client";

export function addCalendarEvent(data: {
  title: string;
  dateStr: string;
  startHour: number;
  durHours?: number;
  allDay?: boolean;
  cat?: CalendarStoreEvent["cat"];
  meta?: string;
  attendees?: string[];
}): CalendarStoreEvent {
  const dur = data.durHours ?? 1;
  const allDay = data.allDay === true;
  const time = allDay ? "All day" : formatTimeRange(data.startHour, dur);
  const newEvent: CalendarStoreEvent = {
    id: Date.now().toString(),
    dateStr: data.dateStr,
    start: data.startHour,
    dur: allDay ? 24 : dur,
    title: data.title,
    cat: data.cat || "meeting",
    time,
    allDay,
    meta: data.meta,
    attendees: data.attendees || ["Bot", "You"],
  };
  globalEvents.push(newEvent);

  // Persist directly to Supabase events table
  void (async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      let activeUserId = userData?.user?.id;

      if (!activeUserId) {
        const { data: sampleEvents } = await supabase.from("events").select("user_id").limit(1);
        if (sampleEvents && sampleEvents[0]?.user_id) {
          activeUserId = sampleEvents[0].user_id;
        }
      }

      if (activeUserId) {
        const { data: inserted, error } = await supabase
          .from("events")
          .insert({
            user_id: activeUserId,
            date_str: newEvent.dateStr,
            start_hour: newEvent.start,
            dur_hours: newEvent.dur,
            title: newEvent.title,
            category: newEvent.cat,
            time_str: newEvent.time,
            all_day: newEvent.allDay,
            meta: newEvent.meta || null,
            attendees: newEvent.attendees,
          })
          .select("*")
          .single();

        if (error) {
          console.error("Failed to insert bot event to Supabase:", error.message);
        } else if (inserted?.id) {
          newEvent.id = inserted.id;
        }
      }
    } catch (err) {
      console.error("Error persisting bot event to Supabase:", err);
    }
  })();

  return newEvent;
}

export function deleteCalendarEvent(target: string): CalendarStoreEvent | null {
  const idx = globalEvents.findIndex(
    (ev) => ev.id === target || ev.title.toLowerCase().includes(target.toLowerCase())
  );
  if (idx !== -1) {
    const deleted = globalEvents[idx];
    globalEvents.splice(idx, 1);

    void (async () => {
      try {
        await supabase.from("events").delete().eq("id", deleted.id);
      } catch {
        // ignore deletion errors
      }
    })();

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
  const time = current.allDay ? "All day" : formatTimeRange(startHour, durHours);

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

  void (async () => {
    try {
      await supabase
        .from("events")
        .update({
          title: updatedEvent.title,
          date_str: updatedEvent.dateStr,
          start_hour: updatedEvent.start,
          dur_hours: updatedEvent.dur,
          category: updatedEvent.cat,
          time_str: updatedEvent.time,
          all_day: updatedEvent.allDay,
          meta: updatedEvent.meta || null,
        })
        .eq("id", updatedEvent.id);
    } catch {
      // ignore update errors
    }
  })();

  return updatedEvent;
}

export function checkFreeSlots(dateStr: string): string[] {
  const dayEvents = getCalendarEvents(dateStr);
  const workingHoursStart = 0;
  const workingHoursEnd = 24;
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
