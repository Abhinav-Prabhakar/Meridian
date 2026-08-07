import { NextResponse } from "next/server";
import { caspianManager } from "@/lib/bot/caspianClient";

export async function POST(req: Request) {
  try {
    const host = req.headers.get("host");
    if (host) {
      void caspianManager.ensureWebhookConfigured(host);
    }
    const body = await req.json();
    const success = await caspianManager.handleWebhookEvent(body);
    return NextResponse.json({ ok: success });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "active", message: "Meridian Caspian Webhook Endpoint" });
}
