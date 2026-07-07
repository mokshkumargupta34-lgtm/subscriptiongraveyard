import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cancelGuides, events, receipts, subscriptions } from "@/db/schema";

/* Dashboard data + mutations. Every function takes userId and scopes
   queries to it — actions must never cross user boundaries. */

export interface GuideStep {
  step: number;
  text: string;
}

export async function getDashboardData(userId: string) {
  const subs = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.dismissed, false)))
    .orderBy(desc(subscriptions.lifetimeCents));

  const allReceipts = await db
    .select({
      id: receipts.id,
      subscriptionId: receipts.subscriptionId,
      amountCents: receipts.amountCents,
      currency: receipts.currency,
      chargedAt: receipts.chargedAt,
      merchantGuess: receipts.merchantGuess,
    })
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(asc(receipts.chargedAt));

  const merchantIds = subs.map((s) => s.merchantId).filter((x): x is string => !!x);
  const guides = merchantIds.length
    ? await db.select().from(cancelGuides).where(inArray(cancelGuides.merchantId, merchantIds))
    : [];
  const guideByMerchant = new Map(guides.map((g) => [g.merchantId, g]));

  return subs.map((s) => ({
    id: s.id,
    displayName: s.displayName,
    cadence: s.cadence,
    amountCents: s.amountCents,
    currency: s.currency,
    firstSeenAt: s.firstSeenAt?.toISOString() ?? null,
    lastChargeAt: s.lastChargeAt?.toISOString() ?? null,
    nextRenewalEst: s.nextRenewalEst?.toISOString() ?? null,
    status: s.status,
    lifetimeCents: s.lifetimeCents,
    confidence: s.confidence,
    alertsEnabled: s.alertsEnabled,
    receipts: allReceipts
      .filter((r) => r.subscriptionId === s.id)
      .map((r) => ({
        id: r.id,
        amountCents: r.amountCents,
        currency: r.currency,
        chargedAt: r.chargedAt?.toISOString() ?? null,
      })),
    guide: s.merchantId
      ? ((g) =>
          g
            ? {
                steps: g.steps as GuideStep[],
                url: g.url,
                phone: g.phone,
                difficulty: g.difficulty,
              }
            : null)(guideByMerchant.get(s.merchantId))
      : null,
  }));
}

export type DashboardSub = Awaited<ReturnType<typeof getDashboardData>>[number];

export async function getApparitions(userId: string) {
  const rows = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.chargedAt));
  return rows
    .filter((r) => r.subscriptionId === null)
    .map((r) => ({
      id: r.id,
      merchantGuess: r.merchantGuess ?? "unknown spirit",
      amountCents: r.amountCents,
      currency: r.currency ?? "USD",
      chargedAt: r.chargedAt?.toISOString() ?? null,
    }));
}

async function ownedSub(userId: string, subId: string) {
  const sub = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)),
  });
  if (!sub) throw new Error("not found");
  return sub;
}

export async function setStatus(userId: string, subId: string, status: "active" | "buried") {
  await ownedSub(userId, subId);
  await db.update(subscriptions).set({ status }).where(eq(subscriptions.id, subId));
  await db.insert(events).values({
    userId,
    type: status === "buried" ? "burial" : "resurrection",
    payload: { subId },
  });
}

export async function dismissSub(userId: string, subId: string) {
  await ownedSub(userId, subId);
  await db.update(subscriptions).set({ dismissed: true }).where(eq(subscriptions.id, subId));
  await db.insert(events).values({ userId, type: "dismissed", payload: { subId } });
}

export async function toggleAlerts(userId: string, subId: string, enabled: boolean) {
  await ownedSub(userId, subId);
  await db.update(subscriptions).set({ alertsEnabled: enabled }).where(eq(subscriptions.id, subId));
}

/* Merge: retag the source's receipts with the target's merchant name so
   future re-scans regroup them together permanently, then fold figures. */
export async function mergeSubs(userId: string, fromId: string, intoId: string) {
  if (fromId === intoId) return;
  const from = await ownedSub(userId, fromId);
  const into = await ownedSub(userId, intoId);

  await db
    .update(receipts)
    .set({ subscriptionId: intoId, merchantGuess: into.displayName })
    .where(and(eq(receipts.userId, userId), eq(receipts.subscriptionId, fromId)));

  await db
    .update(subscriptions)
    .set({
      lifetimeCents: into.lifetimeCents + from.lifetimeCents,
      firstSeenAt:
        from.firstSeenAt && into.firstSeenAt && from.firstSeenAt < into.firstSeenAt
          ? from.firstSeenAt
          : into.firstSeenAt,
    })
    .where(eq(subscriptions.id, intoId));

  await db.delete(subscriptions).where(eq(subscriptions.id, fromId));
  await db.insert(events).values({ userId, type: "merged", payload: { fromId, intoId } });
}

export async function dismissApparition(userId: string, receiptId: string) {
  await db
    .delete(receipts)
    .where(and(eq(receipts.id, receiptId), eq(receipts.userId, userId)));
}

/* Extraction Overview: sum of parsed receipt amounts per month of the
   current year (chart), plus the year total. */
export async function getMonthlyExtraction(userId: string) {
  const year = new Date().getFullYear();
  const rows = await db
    .select({ amountCents: receipts.amountCents, chargedAt: receipts.chargedAt })
    .from(receipts)
    .where(eq(receipts.userId, userId));

  const months = Array.from({ length: 12 }, () => 0);
  for (const r of rows) {
    if (!r.chargedAt || !r.amountCents) continue;
    if (r.chargedAt.getFullYear() !== year) continue;
    months[r.chargedAt.getMonth()] += r.amountCents;
  }
  return { year, months, totalCents: months.reduce((a, b) => a + b, 0) };
}

const CADENCE_PER_YEAR: Record<string, number> = { monthly: 12, yearly: 1, weekly: 52, unknown: 0 };

export function computeStats(subs: DashboardSub[]) {
  const active = subs.filter((s) => s.status === "active");
  const buried = subs.filter((s) => s.status === "buried");
  return {
    totalExtractionCents: subs.reduce((a, s) => a + s.lifetimeCents, 0),
    activeCount: active.length,
    buriedCount: buried.length,
    recoveredPerYearCents: buried.reduce(
      (a, s) => a + s.amountCents * (CADENCE_PER_YEAR[s.cadence] ?? 0),
      0
    ),
  };
}

export function subscriptionsCsv(subs: DashboardSub[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["name", "status", "cadence", "amount", "currency", "lifetime", "first_seen", "last_charge", "next_renewal_est", "confidence"],
    ...subs.map((s) => [
      s.displayName,
      s.status,
      s.cadence,
      (s.amountCents / 100).toFixed(2),
      s.currency,
      (s.lifetimeCents / 100).toFixed(2),
      s.firstSeenAt?.slice(0, 10) ?? "",
      s.lastChargeAt?.slice(0, 10) ?? "",
      s.nextRenewalEst?.slice(0, 10) ?? "",
      s.confidence,
    ]),
  ];
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
