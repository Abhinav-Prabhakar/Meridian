import { NextResponse } from "next/server";
import { caspianManager } from "@/lib/bot/caspianClient";

export async function GET() {
  return NextResponse.json({
    status: caspianManager.getStatus(),
    config: caspianManager.getConfig(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channel, botToken, groqApiKey, action } = body;

    if (action === "disconnect") {
      if (channel === "telegram") {
        await caspianManager.disconnectTelegram();
      }
      return NextResponse.json({
        success: true,
        message: `${channel} disconnected`,
        status: caspianManager.getStatus(),
      });
    }

    if (channel === "telegram") {
      const result = await caspianManager.connectTelegram(botToken, groqApiKey);
      return NextResponse.json({
        ...result,
        status: caspianManager.getStatus(),
      });
    }

    return NextResponse.json(
      { success: false, message: `Channel ${channel} is scheduled for upcoming release` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update channel status" },
      { status: 500 }
    );
  }
}
