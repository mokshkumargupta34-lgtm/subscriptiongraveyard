import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { events, subscriptions, users } from "@/db/schema";

/* Renewal alerts via Resend: 3 days before next_renewal_est for active,
   alert-enabled subscriptions. Deduped through the events log so a
   renewal date is only announced once. No-op without RESEND_API_KEY. */

const WINDOW_DAYS = 3;

export async function sendRenewalAlerts(): Promise<{ sent: number; skipped: number }> {
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: 0 };

  const now = Date.now();
  const horizon = new Date(now + WINDOW_DAYS * 86_400_000);

  const due = await db
    .select({
      sub: subscriptions,
      email: users.email,
      userId: users.id,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.alertsEnabled, true),
        eq(subscriptions.dismissed, false),
        gte(subscriptions.nextRenewalEst, new Date(now))
      )
    );

  let sent = 0;
  let skipped = 0;

  for (const row of due) {
    const renews = row.sub.nextRenewalEst!;
    if (renews > horizon) continue;

    const dedupeKey = `${row.sub.id}:${renews.toISOString().slice(0, 10)}`;
    const already = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.userId, row.userId), eq(events.type, "renewal_alert")));
    if (already.length && (await hasKey(row.userId, dedupeKey))) {
      skipped++;
      continue;
    }

    const amount = `$${(row.sub.amountCents / 100).toFixed(2)}`;
    const dateStr = renews.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const ok = await sendEmail(
      row.email,
      `${row.sub.displayName} rises again on ${dateStr} — ${amount}`,
      [
        `A spirit stirs in your graveyard.`,
        ``,
        `${row.sub.displayName} will charge you ${amount} on ${dateStr}.`,
        `If you no longer use it, now is the moment to bury it:`,
        `${process.env.NEXT_PUBLIC_APP_URL ?? "https://subscriptiongraveyard.vercel.app"}/dashboard`,
        ``,
        `— Subscription Graveyard · est. wherever free trials go to die`,
        `Manage alerts any time from your dashboard.`,
      ].join("\n")
    );

    if (ok) {
      sent++;
      await db.insert(events).values({
        userId: row.userId,
        type: "renewal_alert",
        payload: { key: dedupeKey, subId: row.sub.id },
      });
    }
  }

  return { sent, skipped };
}

async function hasKey(userId: string, key: string): Promise<boolean> {
  const rows = await db
    .select({ payload: events.payload })
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.type, "renewal_alert")));
  return rows.some((r) => (r.payload as { key?: string } | null)?.key === key);
}

async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM ?? "Subscription Graveyard <onboarding@resend.dev>",
      to,
      subject,
      text,
    }),
  });
  return res.ok;
}
