import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { events, merchants, receipts, scans, subscriptions } from "@/db/schema";
import { GmailAuthError, getAccessToken, getMessageMeta, listMessageIds } from "@/lib/gmail";
import { groupReceipts } from "./group";
import { looksLikeReceipt, parseReceipt } from "./parse";

export interface ScanProgress {
  phase: "listing" | "reading" | "grouping" | "done";
  messagesSeen: number;
  receiptsFound: number;
  subscriptionsFound?: number;
  apparitions?: number;
}

const MAX_MESSAGES = 900; /* per scan, MVP quota guard */

function buildQueries(domains: string[]): string[] {
  const queries = [
    'subject:(receipt OR invoice OR renewal OR "payment confirmation" OR "your subscription") newer_than:3y',
  ];
  for (let i = 0; i < domains.length; i += 25) {
    const chunk = domains.slice(i, i + 25);
    queries.push(`from:(${chunk.join(" OR ")}) newer_than:3y`);
  }
  return queries;
}

export async function runScan(
  userId: string,
  onProgress?: (p: ScanProgress) => void | Promise<void>
): Promise<ScanProgress> {
  const [scanRow] = await db.insert(scans).values({ userId }).returning({ id: scans.id });
  const progress: ScanProgress = { phase: "listing", messagesSeen: 0, receiptsFound: 0 };
  const report = async () => {
    await db
      .update(scans)
      .set({ messagesSeen: progress.messagesSeen, receiptsFound: progress.receiptsFound })
      .where(eq(scans.id, scanRow.id));
    await onProgress?.(progress);
  };

  try {
    const token = await getAccessToken(userId);

    const allMerchants = await db.select().from(merchants);
    const merchantByDomain = new Map(allMerchants.map((m) => [m.domain, m.name]));
    const merchantIdByName = new Map(allMerchants.map((m) => [m.name.toLowerCase(), m.id]));

    /* 1. list candidate message ids across query batches */
    const seen = new Set<string>();
    for (const q of buildQueries([...merchantByDomain.keys()])) {
      if (seen.size >= MAX_MESSAGES) break;
      const ids = await listMessageIds(token, q, MAX_MESSAGES - seen.size);
      for (const id of ids) seen.add(id);
    }

    /* skip anything already parsed in a previous scan (idempotent re-scans) */
    const known = new Set(
      (
        await db
          .select({ gmailMessageId: receipts.gmailMessageId })
          .from(receipts)
          .where(eq(receipts.userId, userId))
      ).map((r) => r.gmailMessageId)
    );

    progress.phase = "reading";
    /* 2. metadata-only reads (8 concurrent — well inside Gmail's
       250 quota units/sec/user), cheap classifier, deterministic parse */
    const fresh = [...seen].filter((id) => !known.has(id));
    progress.messagesSeen = seen.size - fresh.length;
    const CONCURRENCY = 8;
    for (let i = 0; i < fresh.length; i += CONCURRENCY) {
      const chunk = fresh.slice(i, i + CONCURRENCY);
      const metas = await Promise.all(chunk.map((id) => getMessageMeta(token, id)));
      for (let j = 0; j < chunk.length; j++) {
        progress.messagesSeen++;
        const meta = metas[j];
        if (!meta || !looksLikeReceipt(meta)) continue;
        const parsed = parseReceipt(meta, merchantByDomain);
        if (!parsed) continue;
        await db
          .insert(receipts)
          .values({
            userId,
            gmailMessageId: chunk[j],
            merchantGuess: parsed.merchantGuess,
            amountCents: parsed.amountCents,
            currency: parsed.currency,
            chargedAt: parsed.chargedAt,
            parsedFrom: parsed.parsedFrom === "subject" ? "subject" : "body",
          })
          .onConflictDoNothing();
        progress.receiptsFound++;
      }
      if (i % (CONCURRENCY * 4) === 0) await report();
    }

    /* 3. regroup ALL of the user's parsed receipts into subscriptions */
    progress.phase = "grouping";
    await report();

    const allParsed = await db
      .select()
      .from(receipts)
      .where(and(eq(receipts.userId, userId)));

    const { subscriptions: clusters, apparitionIds } = groupReceipts(
      allParsed
        .filter((r) => r.amountCents != null && r.chargedAt != null && r.merchantGuess)
        .map((r) => ({
          id: r.id,
          merchantGuess: r.merchantGuess!,
          amountCents: r.amountCents!,
          currency: r.currency ?? "USD",
          chargedAt: r.chargedAt!,
        }))
    );

    const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    const existingByName = new Map(existing.map((s) => [s.displayName.toLowerCase(), s]));

    for (const c of clusters) {
      const prior = existingByName.get(c.displayName.toLowerCase());
      const base = {
        merchantId: merchantIdByName.get(c.displayName.toLowerCase()) ?? null,
        cadence: c.cadence,
        amountCents: c.amountCents,
        currency: c.currency,
        firstSeenAt: c.firstSeenAt,
        lastChargeAt: c.lastChargeAt,
        nextRenewalEst: c.nextRenewalEst,
        lifetimeCents: c.lifetimeCents,
        confidence: c.confidence,
      };
      let subId: string;
      if (prior) {
        /* update figures; NEVER touch status — buried stays buried */
        await db.update(subscriptions).set(base).where(eq(subscriptions.id, prior.id));
        subId = prior.id;
      } else {
        const [ins] = await db
          .insert(subscriptions)
          .values({ userId, displayName: c.displayName, ...base })
          .returning({ id: subscriptions.id });
        subId = ins.id;
      }
      await db
        .update(receipts)
        .set({ subscriptionId: subId })
        .where(inArray(receipts.id, c.receiptIds));
    }

    if (apparitionIds.length) {
      await db
        .update(receipts)
        .set({ subscriptionId: null })
        .where(and(inArray(receipts.id, apparitionIds), isNull(receipts.subscriptionId)));
    }

    progress.phase = "done";
    progress.subscriptionsFound = clusters.length;
    progress.apparitions = apparitionIds.length;
    await db
      .update(scans)
      .set({
        finishedAt: new Date(),
        status: "finished",
        messagesSeen: progress.messagesSeen,
        receiptsFound: progress.receiptsFound,
      })
      .where(eq(scans.id, scanRow.id));
    await db.insert(events).values({
      userId,
      type: "scan_finished",
      payload: { subscriptions: clusters.length, receipts: progress.receiptsFound },
    });
    await onProgress?.(progress);
    return progress;
  } catch (err) {
    await db
      .update(scans)
      .set({
        finishedAt: new Date(),
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(scans.id, scanRow.id));
    if (err instanceof GmailAuthError) throw err;
    throw err;
  }
}
