import { config } from "dotenv";
config({ path: ".env.local" });
config();

/* Exercises the Phase 4 data layer end-to-end against the real DB,
   then restores original state. Aggregate output only. */
async function main() {
  const { db } = await import("../db");
  const {
    computeStats,
    getApparitions,
    getDashboardData,
    setStatus,
    subscriptionsCsv,
    toggleAlerts,
  } = await import("../lib/subs");

  const user = await db.query.users.findFirst();
  if (!user) throw new Error("no user");

  const before = await getDashboardData(user.id);
  const apparitions = await getApparitions(user.id);
  console.log("subs:", before.length, "| apparitions:", apparitions.length);
  console.log("stats before:", JSON.stringify(computeStats(before)));

  if (before.length) {
    const target = before[0];
    console.log("receipts on top sub:", target.receipts.length, "| guide attached:", !!target.guide);

    await setStatus(user.id, target.id, "buried");
    const buried = await getDashboardData(user.id);
    console.log("after bury:", JSON.stringify(computeStats(buried)));

    await toggleAlerts(user.id, target.id, false);
    const toggled = (await getDashboardData(user.id)).find((s) => s.id === target.id)!;
    console.log("alerts toggled off:", toggled.alertsEnabled === false);

    /* restore */
    await setStatus(user.id, target.id, "active");
    await toggleAlerts(user.id, target.id, true);
    const restored = await getDashboardData(user.id);
    console.log("restored:", JSON.stringify(computeStats(restored)));
  }

  const csv = subscriptionsCsv(await getDashboardData(user.id));
  console.log("csv lines:", csv.split("\r\n").length, "| header ok:", csv.startsWith('"name","status"'));
  process.exit(0);
}

main().catch((e) => {
  console.error("failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
