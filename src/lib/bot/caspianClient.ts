import { CommClient, type Connection, type Message } from "caspian-sdk";
import { formatDateStr } from "@/lib/dateUtils";
import { CaspianBotConfig, ChannelStatus, IntegrationChannel } from "./types";
import { processAgentMessage } from "./groqAgent";
import { markdownToTelegramBlocks } from "./telegramBlocks";

export interface IntegrationResult {
  success: boolean;
  message: string;
  address?: string;
  authorizeUrl?: string;
}

class CaspianManager {
  private client: CommClient | null = null;
  private isListening = false;
  private isHandlerRegistered = false;
  private readonly connectionIds: Partial<Record<IntegrationChannel, string>> = {};
  private config: CaspianBotConfig = {
    activeChannels: [],
  };

  private channels: Record<IntegrationChannel, ChannelStatus> = {
    telegram: {
      id: "telegram",
      name: "Telegram Bot",
      icon: "✈️",
      connected: false,
      active: false,
      statusText: "Not connected",
      description: "Ask your Telegram bot to schedule, edit, remove, or query events.",
    },
    email: {
      id: "email",
      name: "Email Agent",
      icon: "✉️",
      connected: false,
      active: false,
      statusText: "Ready to connect",
      description: "Send emails to your Caspian agent identity to manage your calendar.",
    },
    slack: {
      id: "slack",
      name: "Slack App",
      icon: "💬",
      connected: false,
      active: false,
      statusText: "Ready to connect",
      description: "Use direct messages and workspace mentions with the same calendar assistant.",
    },
    discord: {
      id: "discord",
      name: "Discord Bot",
      icon: "🎮",
      connected: false,
      active: false,
      statusText: "Ready to connect",
      description: "Use your Discord server with the same calendar assistant and CRUD tools.",
    },
  };

  public getStatus(): ChannelStatus[] {
    return Object.values(this.channels).map((channel) => ({ ...channel }));
  }

  public getConfig(): CaspianBotConfig {
    return { ...this.config };
  }

  public getPublicConfig(): { activeChannels: IntegrationChannel[]; groqConfigured: boolean; caspianConfigured: boolean } {
    return {
      activeChannels: [...this.config.activeChannels],
      groqConfigured: Boolean(this.config.groqApiKey || process.env.GROQ_API_KEY),
      caspianConfigured: Boolean(this.config.caspianApiKey || process.env.CASPIAN_API_KEY),
    };
  }

  public async connectTelegram(botToken: string, groqApiKey?: string): Promise<IntegrationResult> {
    const cleanToken = (botToken || "").trim().replace(/^@/, "");
    if (!cleanToken) {
      return { success: false, message: "Bot token cannot be empty." };
    }

    if (groqApiKey?.trim()) this.config.groqApiKey = groqApiKey.trim();

    try {
      const connection = await this.getClient().connectTelegram({ botToken: cleanToken });
      this.config.telegramBotToken = cleanToken;
      this.markConnected("telegram", connection);
      await this.startListener();
      return { success: true, message: "Telegram bot connected via Caspian SDK." };
    } catch (error: unknown) {
      return { success: false, message: this.errorMessage(error, "Telegram connection failed") };
    }
  }

  public async connectEmail(username?: string, groqApiKey?: string): Promise<IntegrationResult> {
    if (groqApiKey?.trim()) this.config.groqApiKey = groqApiKey.trim();

    try {
      const connection = await this.getClient().connectEmail(username?.trim() ? { username: username.trim() } : {});
      this.config.emailAddress = connection.address;
      this.markConnected("email", connection);
      await this.startListener();
      return {
        success: true,
        message: connection.address ? `Email agent connected at ${connection.address}.` : "Email agent connected.",
        address: connection.address,
      };
    } catch (error: unknown) {
      return { success: false, message: this.errorMessage(error, "Email connection failed") };
    }
  }

  public async installSlack(displayName?: string, groqApiKey?: string): Promise<IntegrationResult> {
    if (groqApiKey?.trim()) this.config.groqApiKey = groqApiKey.trim();

    try {
      const connection = await this.getClient().installSlack(displayName?.trim() ? { displayName: displayName.trim() } : {});
      this.markConnected("slack", connection);
      await this.startListener();
      return {
        success: true,
        message: connection.authorize_url ? "Slack authorization is ready." : "Slack app connected.",
        authorizeUrl: connection.authorize_url,
      };
    } catch (error: unknown) {
      return { success: false, message: this.errorMessage(error, "Slack connection failed") };
    }
  }

  public async installDiscord(displayName?: string, groqApiKey?: string): Promise<IntegrationResult> {
    if (groqApiKey?.trim()) this.config.groqApiKey = groqApiKey.trim();

    try {
      const connection = await this.getClient().installDiscord(displayName?.trim() ? { displayName: displayName.trim() } : {});
      this.markConnected("discord", connection);
      await this.startListener();
      return {
        success: true,
        message: connection.authorize_url ? "Discord authorization is ready." : "Discord bot connected.",
        authorizeUrl: connection.authorize_url,
      };
    } catch (error: unknown) {
      return { success: false, message: this.errorMessage(error, "Discord connection failed") };
    }
  }

  public async refreshStatus(): Promise<ChannelStatus[]> {
    try {
      const clientAny = this.getClient() as unknown as { request: (method: string, path: string) => Promise<unknown> };
      const connections = (await clientAny.request("GET", "/v1/connections")) as Connection[];
      if (Array.isArray(connections)) {
        const sortedConns = [...connections].sort((a, b) => {
          const aActive = a.status === "active" || a.status === "connected" ? 1 : 0;
          const bActive = b.status === "active" || b.status === "connected" ? 1 : 0;
          return aActive - bActive;
        });

        for (const conn of sortedConns) {
          const channel = conn.channel as IntegrationChannel;
          if (channel && channel in this.channels) {
            this.markConnected(channel, conn);
          }
        }
      }
    } catch {
      await Promise.all(
        (Object.entries(this.connectionIds) as Array<[IntegrationChannel, string | undefined]>).map(
          async ([channel, connectionId]) => {
            if (!connectionId) return;
            try {
              const connection = await this.getClient().getConnection(connectionId);
              this.markConnected(channel, connection);
            } catch {
              // Keep the last known status if the gateway is temporarily unavailable.
            }
          }
        )
      );
    }

    await this.startListener();
    void this.getClient().dispatchPending().catch(() => {});

    return this.getStatus();
  }

  public async testEmail(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getClient().testEmail({
        connectionId: this.connectionIds.email,
        subject: "Meridian integration test",
        text: "Meridian email integration is connected and ready to manage your calendar.",
      });
      return { success: true, message: "Test email sent." };
    } catch (error: unknown) {
      return { success: false, message: this.errorMessage(error, "Test email failed") };
    }
  }

  public async disconnect(channel: IntegrationChannel): Promise<void> {
    delete this.connectionIds[channel];
    this.config.activeChannels = this.config.activeChannels.filter((active) => active !== channel);
    if (channel === "telegram") this.config.telegramBotToken = undefined;
    if (channel === "email") this.config.emailAddress = undefined;
    this.channels[channel] = {
      ...this.channels[channel],
      connected: false,
      active: false,
      statusText: "Not connected",
      address: undefined,
      authorizeUrl: undefined,
      connectionId: undefined,
    };
  }

  private getClient(): CommClient {
    if (!this.client) {
      this.client = new CommClient({
        apiKey: this.config.caspianApiKey || process.env.CASPIAN_API_KEY,
        baseUrl: this.config.caspianBaseUrl || process.env.CASPIAN_BASE_URL,
      });
    }
    return this.client;
  }

  private async startListener(): Promise<void> {
    if (!this.isHandlerRegistered) {
      this.getClient().onMessage(async (message) => this.handleMessage(message));
      this.isHandlerRegistered = true;
    }

    if (!this.isListening) {
      this.isListening = true;
      this.getClient()
        .listen()
        .catch((error: unknown) => {
          this.isListening = false;
          console.warn("Caspian listener stopped:", this.errorMessage(error, "listener error"));
        });
    }
  }

  private async handleMessage(message: Message): Promise<void> {
    const userText = message.text?.trim() || "Attached image request";
    const imageData = this.getImageData(message);

    try {
      const channelGuide = await this.getClient().channelGuide(message.channel).catch(() => undefined);
      const result = await processAgentMessage(
        userText,
        this.config.groqApiKey || process.env.GROQ_API_KEY,
        imageData,
        formatDateStr(new Date()),
        channelGuide
      );
      const telegramBlocks = message.channel === "telegram" ? markdownToTelegramBlocks(result.reply) : null;
      await message.reply(result.reply, null, telegramBlocks);
    } catch (error: unknown) {
      const messageText = this.errorMessage(error, "Calendar assistant failed");
      try {
        await message.reply(`I couldn't complete that request. ${messageText}`);
      } catch {
        console.error("Caspian reply failed:", messageText);
      }
    }
  }

  private getImageData(message: Message): string | undefined {
    const image = message.media.find((media) => {
      const mimeType = media.mimeType || media.mime_type || "";
      return mimeType.startsWith("image/");
    });
    if (!image) return undefined;
    if (image.url) return image.url;
    if (image.data) {
      const mimeType = image.mimeType || image.mime_type || "image/*";
      return image.data.startsWith("data:") ? image.data : `data:${mimeType};base64,${image.data}`;
    }
    return undefined;
  }

  private markConnected(channel: IntegrationChannel, connection: Connection): void {
    this.connectionIds[channel] = connection.id;
    const awaitingAuthorization = Boolean(connection.authorize_url);
    const active = connection.status === "active" || connection.status === "connected";
    this.channels[channel] = {
      ...this.channels[channel],
      connected: active,
      active,
      statusText: awaitingAuthorization
        ? "Authorization required"
        : active
        ? connection.address
          ? `Connected & Active (${connection.address})`
          : "Connected & Active"
        : connection.status || "Provisioning",
      address: connection.address,
      authorizeUrl: connection.authorize_url,
      connectionId: connection.id,
    };

    if (active && !this.config.activeChannels.includes(channel)) {
      this.config.activeChannels.push(channel);
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === "object" && "detail" in error && typeof error.detail === "string") {
      return error.detail;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }
}

export const caspianManager = new CaspianManager();
