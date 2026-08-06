import { NextResponse } from "next/server";
import {
  getCalendarEvents,
  addCalendarEvent,
  syncCalendarEvents,
  deleteCalendarEvent,
} from "@/lib/bot/calendarStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("dateStr") || undefined;
  const events = getCalendarEvents(dateStr);
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "sync" && Array.isArray(body.events)) {
      syncCalendarEvents(body.events);
      return NextResponse.json({ success: true, events: getCalendarEvents() });
    }

    if (body.action === "add") {
      const created = addCalendarEvent(body.event);
      return NextResponse.json({ success: true, event: created, events: getCalendarEvents() });
    }

    if (body.action === "delete") {
      const deleted = deleteCalendarEvent(body.target);
      return NextResponse.json({ success: true, deleted, events: getCalendarEvents() });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
