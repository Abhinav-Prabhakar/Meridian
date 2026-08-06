export type IntegrationChannel = "telegram" | "email" | "slack" | "discord";

export interface ChannelStatus {
  id: IntegrationChannel;
  name: string;
  icon: string;
  connected: boolean;
  active: boolean;
  statusText: string;
  description: string;
}

export interface CaspianBotConfig {
  telegramBotToken?: string;
  groqApiKey?: string;
  caspianApiKey?: string;
  caspianBaseUrl?: string;
  activeChannels: IntegrationChannel[];
}

export interface BotChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  channel?: IntegrationChannel | "web";
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
  executedAction?: {
    type: "add" | "delete" | "query";
    title?: string;
    dateStr?: string;
    time?: string;
  };
}

export interface CalendarStoreEvent {
  id: string;
  dateStr: string;
  start: number;
  dur: number;
  title: string;
  cat: "meeting" | "focus" | "personal" | "strategy" | "learning";
  time: string;
  meta?: string;
  attendees?: string[];
}
