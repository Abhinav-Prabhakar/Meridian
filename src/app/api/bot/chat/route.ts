import { NextResponse } from "next/server";
import { processAgentMessage } from "@/lib/bot/groqAgent";
import { getCalendarEvents, syncCalendarEvents } from "@/lib/bot/calendarStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, apiKey, clientEvents } = body;

    if (clientEvents && Array.isArray(clientEvents)) {
      syncCalendarEvents(clientEvents);
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message string is required" },
        { status: 400 }
      );
    }

    const result = await processAgentMessage(message, apiKey);
    const updatedEvents = getCalendarEvents();

    return NextResponse.json({
      reply: result.reply,
      toolCalls: result.toolCallsExecuted,
      executedAction: result.executedAction,
      newEvent: result.newEvent,
      allEvents: updatedEvents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process bot message" },
      { status: 500 }
    );
  }
}
