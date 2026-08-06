import { NextResponse } from "next/server";
import { processAgentMessage, GroqApiError } from "@/lib/bot/groqAgent";
import { getCalendarEvents, syncCalendarEvents } from "@/lib/bot/calendarStore";
import { caspianManager } from "@/lib/bot/caspianClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, apiKey, clientEvents, image, today } = body;

    if (clientEvents && Array.isArray(clientEvents)) {
      syncCalendarEvents(clientEvents);
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message string is required" },
        { status: 400 }
      );
    }

    const resolvedApiKey =
      apiKey ||
      caspianManager.getConfig().groqApiKey ||
      process.env.GROQ_API_KEY;

    if (!resolvedApiKey) {
      return NextResponse.json(
        { error: "Groq API key is required. Add it in ⚡ Integrations, or set the GROQ_API_KEY environment variable." },
        { status: 400 }
      );
    }

    const result = await processAgentMessage(message, resolvedApiKey, image, today);
    const updatedEvents = getCalendarEvents();

    return NextResponse.json({
      reply: result.reply,
      toolCalls: result.toolCallsExecuted,
      executedAction: result.executedAction,
      newEvent: result.newEvent,
      updatedEvent: result.updatedEvent,
      deletedId: result.deletedId,
      allEvents: updatedEvents,
    });
  } catch (error: unknown) {
    if (error instanceof GroqApiError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process bot message" },
      { status: 500 }
    );
  }
}
