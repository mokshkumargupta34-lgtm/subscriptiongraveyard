import { config } from "dotenv";
config({ path: ".env.local" });
config();

/* Compliance verification: deleting a user must cascade to every row
   we hold about them. Creates a synthetic user + rows in each table,
   deletes the user, asserts all gone. (docs/dpa-notes.md) */
async function main() {
  const { db } = await import("../db");
  const { eq } = await import("drizzle-orm");
  const { users, googleAccounts, subscriptions, receipts, scans, events } = await import(
    "../db/schema"
  );

  const [u] = await db
    .insert(users)
    .values({ email: `cascade-test-${Date.now()}@example.invalid`, name: "Cascade Test" })
    .returning({ id: users.id });

  await db.insert(googleAccounts).values({
    userId: u.id,
    googleSub: `synthetic-${Date.now()}`,
    accessTokenEnc: "x",
    refreshTokenEnc: "x",
    scope: "test",
  });
  const [sub] = await db
    .insert(subscriptions)
    .values({ userId: u.id, displayName: "GhostFlix", amountCents: 999, lifetimeCents: 999 })
    .returning({ id: subscriptions.id });
  await db.insert(receipts).values({
    userId: u.id,
    subscriptionId: sub.id,
    gmailMessageId: `synthetic-${Date.now()}`,
    merchantGuess: "GhostFlix",
    amountCents: 999,
    chargedAt: new Date(),
  });
  await db.insert(scans).values({ userId: u.id, status: "finished" });
  await db.insert(events).values({ userId: u.id, type: "test" });

  const count = async () => {
    const rows = await Promise.all([
      db.select().from(googleAccounts).where(eq(googleAccounts.userId, u.id)),
      db.select().from(subscriptions).where(eq(subscriptions.userId, u.id)),
      db.select().from(receipts).where(eq(receipts.userId, u.id)),
      db.select().from(scans).where(eq(scans.userId, u.id)),
      db.select().from(events).where(eq(events.userId, u.id)),
    ]);
    return rows.map((r) => r.length);
  };

  console.log("rows before delete [accounts,subs,receipts,scans,events]:", await count());
  await db.delete(users).where(eq(users.id, u.id));
  const after = await count();
  console.log("rows after delete :", after);

  const clean = after.every((n) => n === 0);
  console.log(clean ? "CASCADE VERIFIED ✓ — zero rows survive user deletion" : "CASCADE FAILED ✗");
  process.exit(clean ? 0 : 1);
}

main().catch((e) => {
  console.error("failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
