import OpenAI from "openai";
import {
  getCalendarEvents,
  addCalendarEvent,
  deleteCalendarEvent,
  checkFreeSlots,
} from "./calendarStore";
import { BotChatMessage } from "./types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export async function processAgentMessage(
  userText: string,
  userApiKey?: string,
  currentEventsContext?: any[]
): Promise<{
  reply: string;
  toolCallsExecuted: Array<{ name: string; args: Record<string, unknown> }>;
  executedAction?: BotChatMessage["executedAction"];
  newEvent?: any;
}> {
  const apiKey = userApiKey || process.env.GROQ_API_KEY || "demo_groq_key";
  const toolCallsExecuted: Array<{ name: string; args: Record<string, unknown> }> = [];
  let executedAction: BotChatMessage["executedAction"] = undefined;
  let newEvent: any = undefined;

  // Standard demo current date reference if relative date terms like "today", "tomorrow" are used
  const todayStr = "2024-11-20";

  // Intent detection helper for direct natural language execution
  const lowerText = userText.toLowerCase();

  // Try direct pattern parsing first for speed & reliability
  if (
    lowerText.includes("add") ||
    lowerText.includes("schedule") ||
    lowerText.includes("create") ||
    lowerText.includes("book") ||
    lowerText.includes("set up")
  ) {
    let title = "New Event";
    let startHour = 14;
    let durHours = 1;
    let dateStr = todayStr;
    let category: "meeting" | "focus" | "personal" | "strategy" | "learning" = "meeting";

    // Extract title if quote or simple text exists
    const matchQuote = userText.match(/["']([^"']+)["']/);
    if (matchQuote) {
      title = matchQuote[1];
    } else {
      const withMatch = userText.match(/(?:schedule|add|create|book|set up)\s+(?:a\s+|an\s+)?([^at\d\n]+?)(?=\s+at|\s+on|\s+for|\s+tomorrow|\s+today|$)/i);
      if (withMatch && withMatch[1].trim()) {
        title = withMatch[1].trim();
      }
    }

    if (lowerText.includes("tomorrow")) {
      dateStr = "2024-11-21";
    } else if (lowerText.includes("friday")) {
      dateStr = "2024-11-22";
    } else if (lowerText.includes("thursday")) {
      dateStr = "2024-11-21";
    } else if (lowerText.includes("monday")) {
      dateStr = "2024-11-18";
    } else if (lowerText.includes("tuesday")) {
      dateStr = "2024-11-19";
    }

    // Extract time (e.g. 3pm, 10am, 15:00)
    const timeMatch = lowerText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) / 60 : 0;
      const ampm = timeMatch[3];
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
      if (hour >= 0 && hour <= 23) {
        startHour = hour + mins;
      }
    }

    if (lowerText.includes("focus") || lowerText.includes("work")) category = "focus";
    if (lowerText.includes("lunch") || lowerText.includes("coffee") || lowerText.includes("gym")) category = "personal";
    if (lowerText.includes("strategy") || lowerText.includes("sync") || lowerText.includes("review")) category = "strategy";

    // Perform event addition
    newEvent = addCalendarEvent({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      dateStr,
      startHour,
      durHours,
      cat: category,
      meta: "Created via GPT-OSS-120b Assistant",
    });

    toolCallsExecuted.push({
      name: "add_calendar_event",
      args: { title: newEvent.title, dateStr, startHour, durHours },
    });

    executedAction = {
      type: "add",
      title: newEvent.title,
      dateStr: newEvent.dateStr,
      time: newEvent.time,
    };

    return {
      reply: `I've added **${newEvent.title}** to your calendar on **${dateStr}** from **${newEvent.time}**.`,
      toolCallsExecuted,
      executedAction,
      newEvent,
    };
  }

  // Check query / schedule requests
  if (
    lowerText.includes("what") ||
    lowerText.includes("show") ||
    lowerText.includes("schedule") ||
    lowerText.includes("events") ||
    lowerText.includes("free") ||
    lowerText.includes("available") ||
    lowerText.includes("query") ||
    lowerText.includes("details")
  ) {
    let queryDate = todayStr;
    if (lowerText.includes("tomorrow")) queryDate = "2024-11-21";
    if (lowerText.includes("friday")) queryDate = "2024-11-22";

    if (lowerText.includes("free") || lowerText.includes("available")) {
      const freeSlots = checkFreeSlots(queryDate);
      toolCallsExecuted.push({ name: "check_free_slots", args: { dateStr: queryDate } });
      executedAction = { type: "query", dateStr: queryDate };
      const slotsFormatted = freeSlots.length > 0 ? freeSlots.join(", ") : "No open slots found.";
      return {
        reply: `Here are your open time slots for **${queryDate}**:\n\n• ${slotsFormatted}`,
        toolCallsExecuted,
        executedAction,
      };
    } else {
      const events = getCalendarEvents(queryDate);
      toolCallsExecuted.push({ name: "get_calendar_events", args: { dateStr: queryDate } });
      executedAction = { type: "query", dateStr: queryDate };

      if (events.length === 0) {
        return {
          reply: `You have no events scheduled on **${queryDate}**. You're clear all day!`,
          toolCallsExecuted,
          executedAction,
        };
      }

      const eventList = events.map((ev) => `• **${ev.time}**: ${ev.title} (${ev.cat})`).join("\n");
      return {
        reply: `Here is your schedule for **${queryDate}** (${events.length} event${events.length > 1 ? "s" : ""}):\n\n${eventList}`,
        toolCallsExecuted,
        executedAction,
      };
    }
  }

  // If real API key is supplied, attempt direct Groq completion call using GPT-OSS-120b model
  if (userApiKey && userApiKey !== "demo_groq_key") {
    try {
      const client = new OpenAI({
        apiKey,
        baseURL: GROQ_BASE_URL,
      });

      const eventsSnapshot = getCalendarEvents();
      const response = await client.chat.completions.create({
        model: "openai/gpt-oss-120b", // or llama-3.3-70b-versatile
        messages: [
          {
            role: "system",
            content: `You are the Meridian Calendar Assistant powered by Caspian SDK and Groq GPT-OSS-120b.
Current Reference Date: ${todayStr}.
Current User Schedule: ${JSON.stringify(eventsSnapshot)}.
Respond concisely and help users manage, add, or inspect calendar events.`,
          },
          { role: "user", content: userText },
        ],
      });

      const replyContent = response.choices[0]?.message?.content || "I've processed your request.";
      return { reply: replyContent, toolCallsExecuted };
    } catch (err: any) {
      console.warn("Groq API error fallback to local agent:", err?.message);
    }
  }

  // Default response for general chat
  return {
    reply: `I'm your Meridian GPT-OSS-120b Calendar Assistant. You can ask me to add events (e.g., "Schedule a Team Sync tomorrow at 3pm"), check your free time, or inspect your agenda for any day.`,
    toolCallsExecuted: [],
  };
}
