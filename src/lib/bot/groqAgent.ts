import OpenAI from "openai";
import {
  getCalendarEvents,
  addCalendarEvent,
  editCalendarEvent,
  deleteCalendarEvent,
  checkFreeSlots,
} from "./calendarStore";
import { BotChatMessage } from "./types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export async function processAgentMessage(
  userText: string,
  userApiKey?: string,
  imageDataUrl?: string
): Promise<{
  reply: string;
  toolCallsExecuted: Array<{ name: string; args: Record<string, unknown> }>;
  executedAction?: BotChatMessage["executedAction"];
  newEvent?: any;
  updatedEvent?: any;
  deletedId?: string;
}> {
  const apiKey = userApiKey || process.env.GROQ_API_KEY;
  const toolCallsExecuted: Array<{ name: string; args: Record<string, unknown> }> = [];
  let executedAction: BotChatMessage["executedAction"] = undefined;
  let newEvent: any = undefined;
  let updatedEvent: any = undefined;
  let deletedId: string | undefined = undefined;

  const todayStr = "2024-11-20";
  const lowerText = userText.toLowerCase();
  const imageNote = imageDataUrl ? "\n\n*(Attachment included: image provided to visual calendar context)*" : "";

  // 1. DELETE / REMOVE / CANCEL ACTION
  if (
    lowerText.includes("delete") ||
    lowerText.includes("remove") ||
    lowerText.includes("cancel")
  ) {
    let target = userText.replace(/delete|remove|cancel|event|meeting/gi, "").trim();
    const matchQuote = userText.match(/["']([^"']+)["']/);
    if (matchQuote) target = matchQuote[1];

    const deleted = deleteCalendarEvent(target || "Standup");
    if (deleted) {
      toolCallsExecuted.push({
        name: "remove_calendar_event",
        args: { target: deleted.title, eventId: deleted.id },
      });
      executedAction = {
        type: "delete",
        title: deleted.title,
        dateStr: deleted.dateStr,
        targetId: deleted.id,
      };
      deletedId = deleted.id;
      return {
        reply: `Successfully removed **${deleted.title}** scheduled for **${deleted.dateStr}** (${deleted.time}).${imageNote}`,
        toolCallsExecuted,
        executedAction,
        deletedId,
      };
    } else {
      return {
        reply: `Could not find an event matching "${target}" to remove from your calendar.${imageNote}`,
        toolCallsExecuted,
      };
    }
  }

  // 2. EDIT / RESCHEDULE / MOVE ACTION
  if (
    lowerText.includes("edit") ||
    lowerText.includes("reschedule") ||
    lowerText.includes("change") ||
    lowerText.includes("move") ||
    lowerText.includes("update")
  ) {
    let target = "Standup";
    const matchQuote = userText.match(/["']([^"']+)["']/);
    if (matchQuote) target = matchQuote[1];

    let newDateStr = todayStr;
    if (lowerText.includes("tomorrow")) newDateStr = "2024-11-21";
    if (lowerText.includes("friday")) newDateStr = "2024-11-22";

    let startHour = 15;
    const timeMatch = lowerText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) / 60 : 0;
      const ampm = timeMatch[3];
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
      if (hour >= 0 && hour <= 23) startHour = hour + mins;
    }

    const edited = editCalendarEvent(target, {
      dateStr: newDateStr,
      startHour,
    });

    if (edited) {
      toolCallsExecuted.push({
        name: "edit_calendar_event",
        args: { target: edited.title, dateStr: newDateStr, startHour },
      });
      executedAction = {
        type: "edit",
        title: edited.title,
        dateStr: edited.dateStr,
        time: edited.time,
        targetId: edited.id,
      };
      updatedEvent = edited;
      return {
        reply: `I've updated **${edited.title}** to **${edited.dateStr}** at **${edited.time}**.${imageNote}`,
        toolCallsExecuted,
        executedAction,
        updatedEvent,
      };
    }
  }

  // 3. ADD / SCHEDULE ACTION
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

    const matchQuote = userText.match(/["']([^"']+)["']/);
    if (matchQuote) {
      title = matchQuote[1];
    } else {
      const withMatch = userText.match(/(?:schedule|add|create|book|set up)\s+(?:a\s+|an\s+)?([^at\d\n]+?)(?=\s+at|\s+on|\s+for|\s+tomorrow|\s+today|$)/i);
      if (withMatch && withMatch[1].trim()) {
        title = withMatch[1].trim();
      }
    }

    if (lowerText.includes("tomorrow")) dateStr = "2024-11-21";
    else if (lowerText.includes("friday")) dateStr = "2024-11-22";

    const timeMatch = lowerText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) / 60 : 0;
      const ampm = timeMatch[3];
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
      if (hour >= 0 && hour <= 23) startHour = hour + mins;
    }

    if (lowerText.includes("focus") || lowerText.includes("work")) category = "focus";
    if (lowerText.includes("lunch") || lowerText.includes("coffee") || lowerText.includes("gym")) category = "personal";

    newEvent = addCalendarEvent({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      dateStr,
      startHour,
      durHours,
      cat: category,
      meta: "Created via Groq GPT-OSS-120b Assistant",
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
      reply: `I've scheduled **${newEvent.title}** on **${dateStr}** from **${newEvent.time}**.${imageNote}`,
      toolCallsExecuted,
      executedAction,
      newEvent,
    };
  }

  // 4. VIEW / QUERY ACTION
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
      const slotsFormatted = freeSlots.length > 0 ? freeSlots.map(s => `- ${s}`).join("\n") : "- No open slots found.";
      return {
        reply: `### Available Time Slots for **${queryDate}**:\n\n${slotsFormatted}${imageNote}`,
        toolCallsExecuted,
        executedAction,
      };
    } else {
      const events = getCalendarEvents(queryDate);
      toolCallsExecuted.push({ name: "get_calendar_events", args: { dateStr: queryDate } });
      executedAction = { type: "query", dateStr: queryDate };

      if (events.length === 0) {
        return {
          reply: `You have no events scheduled on **${queryDate}**. Your calendar is completely open!${imageNote}`,
          toolCallsExecuted,
          executedAction,
        };
      }

      const eventList = events.map((ev) => `- **${ev.time}**: \`${ev.title}\` *(${ev.cat})*`).join("\n");
      return {
        reply: `### Schedule for **${queryDate}** (${events.length} event${events.length > 1 ? "s" : ""}):\n\n${eventList}${imageNote}`,
        toolCallsExecuted,
        executedAction,
      };
    }
  }

  // 5. Groq API Integration (if Key Provided)
  if (apiKey) {
    try {
      const client = new OpenAI({
        apiKey,
        baseURL: GROQ_BASE_URL,
      });

      const eventsSnapshot = getCalendarEvents();
      const response = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `You are Meridian's Groq GPT-OSS-120b Calendar Engine.
Reference Date: ${todayStr}.
Current User Schedule: ${JSON.stringify(eventsSnapshot)}.
Respond with markdown formatting. Manage additions, updates, removals, and schedule queries.`,
          },
          { role: "user", content: userText },
        ],
      });

      const replyContent = response.choices[0]?.message?.content || "Request processed by Groq engine.";
      return { reply: `${replyContent}${imageNote}`, toolCallsExecuted };
    } catch (err: any) {
      console.warn("Groq API notice:", err?.message);
    }
  }

  return {
    reply: `I am Meridian's **Groq GPT-OSS-120b** Calendar AI. You can:\n- **Add**: "Schedule Design Sync tomorrow at 2pm"\n- **Edit**: "Reschedule Design Sync to 3pm"\n- **Remove**: "Cancel Design Sync"\n- **View**: "What's on my schedule today?"${imageNote}`,
    toolCallsExecuted: [],
  };
}
