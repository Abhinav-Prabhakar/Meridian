import { caspianManager } from "./caspianClient";

async function runDaemon() {
  console.log("⚡ Starting Meridian Local Telegram & Caspian Bot Listener...");
  const status = await caspianManager.refreshStatus();
  const active = status.filter((s) => s.connected);
  console.log("---------------------------------------------------------");
  if (active.length > 0) {
    console.log("🟢 Connected Channels:");
    active.forEach((ch) => console.log(`  • ${ch.name}: ${ch.statusText}`));
  } else {
    console.log("⚠️ No active channels found. Pass your token via integrations modal or environment.");
  }
  console.log("---------------------------------------------------------");
  console.log("🚀 Listening for incoming messages 24/7 (Press Ctrl+C to stop)...");
}

runDaemon().catch((err) => {
  console.error("❌ Bot daemon encountered error:", err);
  process.exit(1);
});
