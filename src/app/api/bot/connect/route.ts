import { NextResponse } from "next/server";
import { caspianManager } from "@/lib/bot/caspianClient";
import { IntegrationChannel } from "@/lib/bot/types";

const channels: IntegrationChannel[] = ["telegram", "email", "slack", "discord"];

function isIntegrationChannel(value: unknown): value is IntegrationChannel {
  return typeof value === "string" && channels.includes(value as IntegrationChannel);
}

export async function GET() {
  const status = await caspianManager.refreshStatus();
  return NextResponse.json({
    status,
    config: caspianManager.getPublicConfig(),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { channel, botToken, groqApiKey, action, username } = body;

    if (!isIntegrationChannel(channel)) {
      return NextResponse.json({ success: false, message: "Unknown integration channel" }, { status: 400 });
    }

    if (action === "disconnect") {
      await caspianManager.disconnect(channel);
      return NextResponse.json({
        success: true,
        message: `${channel} disconnected`,
        status: caspianManager.getStatus(),
      });
    }

    if (channel === "telegram") {
      const result = await caspianManager.connectTelegram(
        typeof botToken === "string" ? botToken : "",
        typeof groqApiKey === "string" ? groqApiKey : undefined
      );
      return NextResponse.json({ ...result, status: caspianManager.getStatus() }, { status: result.success ? 200 : 400 });
    }

    if (channel === "email" && action === "connect") {
      const result = await caspianManager.connectEmail(
        typeof username === "string" ? username : undefined,
        typeof groqApiKey === "string" ? groqApiKey : undefined
      );
      return NextResponse.json({ ...result, status: caspianManager.getStatus() }, { status: result.success ? 200 : 400 });
    }

    if (channel === "email" && action === "test_email") {
      const result = await caspianManager.testEmail();
      return NextResponse.json({ ...result, status: caspianManager.getStatus() }, { status: result.success ? 200 : 400 });
    }

    return NextResponse.json(
      { success: false, message: `Channel ${channel} is not configured yet` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update integration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
