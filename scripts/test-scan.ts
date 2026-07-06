import { config } from "dotenv";
config({ path: ".env.local" });
config();

/* One-off pipeline verification against the connected mailbox.
   Prints AGGREGATES ONLY — no merchant names, subjects, or amounts. */
async function main() {
  const { db } = await import("../db");
  const { runScan } = await import("../lib/scan");

  const user = await db.query.users.findFirst();
  if (!user) throw new Error("no user in db");
  console.log("scanning for user id:", user.id.slice(0, 8) + "…");

  const t0 = Date.now();
  const final = await runScan(user.id, (p) => {
    if (p.messagesSeen % 100 === 0 || p.phase !== "reading") {
      console.log(`[${p.phase}] messages=${p.messagesSeen} receipts=${p.receiptsFound}`);
    }
  });

  console.log("--- summary ---");
  console.log("messages seen   :", final.messagesSeen);
  console.log("receipts parsed :", final.receiptsFound);
  console.log("subscriptions   :", final.subscriptionsFound);
  console.log("apparitions     :", final.apparitions);
  console.log("duration        :", Math.round((Date.now() - t0) / 1000) + "s");

  const { subscriptions } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");
  const subs = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
  const byCadence: Record<string, number> = {};
  for (const s of subs) byCadence[s.cadence] = (byCadence[s.cadence] ?? 0) + 1;
  console.log("cadence breakdown:", JSON.stringify(byCadence));
  console.log("avg confidence  :", subs.length ? (subs.reduce((a, s) => a + s.confidence, 0) / subs.length).toFixed(2) : "n/a");
  process.exit(0);
}

main().catch((e) => {
  console.error("scan failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
