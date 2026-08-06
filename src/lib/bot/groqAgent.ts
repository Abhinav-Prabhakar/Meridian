import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  getCalendarEvents,
  addCalendarEvent,
  editCalendarEvent,
  deleteCalendarEvent,
  checkFreeSlots,
} from "./calendarStore";
import { BotChatMessage, CalendarStoreEvent } from "./types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MAX_TOOL_ROUNDS = 5;

export class GroqApiError extends Error {}

interface ToolOutcome {
  result: unknown;
  executedAction?: BotChatMessage["executedAction"];
  newEvent?: CalendarStoreEvent;
  updatedEvent?: CalendarStoreEvent;
  deletedId?: string;
}

function executeTool(
  name: string,
  args: Record<string, unknown>,
  todayStr: string
): ToolOutcome {
  switch (name) {
    case "get_calendar_events": {
      const dateStr = typeof args.dateStr === "string" ? args.dateStr : undefined;
      const events = getCalendarEvents(dateStr);
      return { result: { ok: true, events, count: events.length } };
    }

    case "check_free_slots": {
      const dateStr = (typeof args.dateStr === "string" && args.dateStr) || todayStr;
      const slots = checkFreeSlots(dateStr);
      return { result: { ok: true, dateStr, slots } };
    }

    case "add_calendar_event": {
      const event = addCalendarEvent({
        title: String(args.title || "New Event"),
        dateStr: String(args.dateStr || todayStr),
        startHour: Number(args.startHour) || 14,
        durHours: args.durHours != null ? Number(args.durHours) : 1,
        cat: args.cat as CalendarStoreEvent["cat"],
        meta: args.meta ? String(args.meta) : "Created via Meridian AI Assistant",
      });
      return {
        result: { ok: true, event },
        executedAction: {
          type: "add",
          title: event.title,
          dateStr: event.dateStr,
          time: event.time,
        },
        newEvent: event,
      };
    }

    case "edit_calendar_event": {
      const edited = editCalendarEvent(String(args.target), {
        newTitle: args.newTitle ? String(args.newTitle) : undefined,
        dateStr: args.dateStr ? String(args.dateStr) : undefined,
        startHour: args.startHour != null ? Number(args.startHour) : undefined,
        durHours: args.durHours != null ? Number(args.durHours) : undefined,
      });
      if (!edited) {
        return { result: { ok: false, error: `No event found matching "${args.target}"` } };
      }
      return {
        result: { ok: true, event: edited },
        executedAction: {
          type: "edit",
          title: edited.title,
          dateStr: edited.dateStr,
          time: edited.time,
          targetId: edited.id,
        },
        updatedEvent: edited,
      };
    }

    case "delete_calendar_event": {
      const deleted = deleteCalendarEvent(String(args.target));
      if (!deleted) {
        return { result: { ok: false, error: `No event found matching "${args.target}"` } };
      }
      return {
        result: { ok: true, event: deleted },
        executedAction: {
          type: "delete",
          title: deleted.title,
          dateStr: deleted.dateStr,
          targetId: deleted.id,
        },
        deletedId: deleted.id,
      };
    }

    default:
      return { result: { ok: false, error: `Unknown tool: ${name}` } };
  }
}

const CALENDAR_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_calendar_events",
      description:
        "List the user's calendar events. Pass a date string (YYYY-MM-DD) to filter to that day, or omit it to return everything.",
      parameters: {
        type: "object",
        properties: {
          dateStr: {
            type: "string",
            description: "Optional date in YYYY-MM-DD format",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_free_slots",
      description: "List free/open time slots within working hours for a given date.",
      parameters: {
        type: "object",
        properties: {
          dateStr: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
        },
        required: ["dateStr"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_calendar_event",
      description: "Add a new event to the calendar.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          dateStr: { type: "string", description: "Date in YYYY-MM-DD format" },
          startHour: {
            type: "number",
            description: "Start hour as a decimal, e.g. 14 for 2:00 PM, 9.5 for 9:30 AM",
          },
          durHours: { type: "number", description: "Duration in hours, defaults to 1" },
          cat: {
            type: "string",
            enum: ["meeting", "focus", "personal", "strategy", "learning"],
            description: "Event category",
          },
          meta: { type: "string", description: "Optional metadata / notes" },
        },
        required: ["title", "dateStr", "startHour"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "edit_calendar_event",
      description: "Reschedule or update an existing event, matched by title or id.",
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", description: "Existing event title or id to modify" },
          newTitle: { type: "string", description: "Optional new title" },
          dateStr: { type: "string", description: "Optional new date in YYYY-MM-DD format" },
          startHour: { type: "number", description: "Optional new start hour" },
          durHours: { type: "number", description: "Optional new duration in hours" },
        },
        required: ["target"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_calendar_event",
      description: "Delete an event, matched by title or id.",
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", description: "Event title or id to remove" },
        },
        required: ["target"],
      },
    },
  },
];

export async function processAgentMessage(
  userText: string,
  userApiKey?: string,
  imageDataUrl?: string,
  referenceDate?: string
): Promise<{
  reply: string;
  toolCallsExecuted: Array<{ name: string; args: Record<string, unknown> }>;
  executedAction?: BotChatMessage["executedAction"];
  newEvent?: CalendarStoreEvent;
  updatedEvent?: CalendarStoreEvent;
  deletedId?: string;
}> {
  const apiKey = userApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqApiError(
      "Groq API key is required. Add it in ⚡ Integrations, or set the GROQ_API_KEY environment variable."
    );
  }

  const todayStr = referenceDate || new Date().toISOString().slice(0, 10);
  const imageNote = imageDataUrl
    ? "\n\n*(Attachment included: image provided for visual calendar context)*"
    : "";

  const client = new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
  });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const eventsSnapshot = getCalendarEvents();

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: [
        "You are Meridian's Groq Calendar AI Assistant.",
        `Reference Date (today): ${todayStr}.`,
        'Use the reference date to interpret relative terms like "today", "tomorrow", and "next Friday", and always emit dates in YYYY-MM-DD format.',
        `Current User Schedule: ${JSON.stringify(eventsSnapshot)}.`,
        "You have tools to manage the calendar. Inspect or modify events with them, then reply in concise Markdown summarizing what you did or found.",
      ].join("\n"),
    },
    { role: "user", content: userText },
  ];

  const toolCallsExecuted: Array<{ name: string; args: Record<string, unknown> }> = [];
  let executedAction: BotChatMessage["executedAction"] | undefined;
  let newEvent: CalendarStoreEvent | undefined;
  let updatedEvent: CalendarStoreEvent | undefined;
  let deletedId: string | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.chat.completions.create({
      model,
      messages,
      tools: CALENDAR_TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const message = response.choices[0]?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        if (toolCall.type !== "function") continue;
        const name = toolCall.function.name || "";
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          // Malformed arguments: pass empty object and let the tool report a clear error
        }

        toolCallsExecuted.push({ name, args });

        let outcome: ToolOutcome;
        try {
          outcome = executeTool(name, args, todayStr);
        } catch (err) {
          outcome = {
            result: { ok: false, error: err instanceof Error ? err.message : "Tool execution failed" },
          };
        }

        if (outcome.executedAction) executedAction = outcome.executedAction;
        if (outcome.newEvent) newEvent = outcome.newEvent;
        if (outcome.updatedEvent) updatedEvent = outcome.updatedEvent;
        if (outcome.deletedId) deletedId = outcome.deletedId;

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(outcome.result),
        });
      }
      continue;
    }

    return {
      reply: (message?.content || "Request processed by Groq engine.") + imageNote,
      toolCallsExecuted,
      executedAction,
      newEvent,
      updatedEvent,
      deletedId,
    };
  }

  return {
    reply: "Request processed by Groq engine." + imageNote,
    toolCallsExecuted,
    executedAction,
    newEvent,
    updatedEvent,
    deletedId,
  };
}
