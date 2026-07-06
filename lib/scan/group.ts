/* Cluster parsed receipts into subscriptions:
   merchant + amount tolerance ±15%, cadence from median interval,
   confidence from receipt count + interval regularity.
   Single receipts stay ungrouped — the "apparitions" review list. */

export interface ReceiptLike {
  id: string;
  merchantGuess: string;
  amountCents: number;
  currency: string;
  chargedAt: Date;
}

export type Cadence = "monthly" | "yearly" | "weekly" | "unknown";

export interface SubscriptionCluster {
  displayName: string;
  cadence: Cadence;
  amountCents: number;
  currency: string;
  firstSeenAt: Date;
  lastChargeAt: Date;
  nextRenewalEst: Date | null;
  lifetimeCents: number;
  confidence: number;
  receiptIds: string[];
}

const DAY = 86_400_000;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function cadenceFromIntervalDays(days: number): Cadence {
  if (days >= 6 && days <= 8) return "weekly";
  if (days >= 27 && days <= 33) return "monthly";
  if (days >= 350 && days <= 380) return "yearly";
  return "unknown";
}

const CADENCE_MS: Record<Cadence, number | null> = {
  weekly: 7 * DAY,
  monthly: 30 * DAY,
  yearly: 365 * DAY,
  unknown: null,
};

export function groupReceipts(receipts: ReceiptLike[]): {
  subscriptions: SubscriptionCluster[];
  apparitionIds: string[];
} {
  /* bucket by normalized merchant */
  const byMerchant = new Map<string, ReceiptLike[]>();
  for (const r of receipts) {
    const key = r.merchantGuess.toLowerCase().trim();
    (byMerchant.get(key) ?? byMerchant.set(key, []).get(key)!).push(r);
  }

  const subscriptions: SubscriptionCluster[] = [];
  const apparitionIds: string[] = [];

  for (const group of byMerchant.values()) {
    /* sub-cluster by amount within ±15% of the cluster's running mean */
    const clusters: ReceiptLike[][] = [];
    for (const r of [...group].sort((a, b) => a.amountCents - b.amountCents)) {
      const home = clusters.find((c) => {
        const mean = c.reduce((s, x) => s + x.amountCents, 0) / c.length;
        return Math.abs(r.amountCents - mean) <= mean * 0.15;
      });
      if (home) home.push(r);
      else clusters.push([r]);
    }

    for (const cluster of clusters) {
      if (cluster.length < 2) {
        apparitionIds.push(...cluster.map((r) => r.id));
        continue;
      }

      const sorted = [...cluster].sort((a, b) => a.chargedAt.getTime() - b.chargedAt.getTime());
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        intervals.push((sorted[i].chargedAt.getTime() - sorted[i - 1].chargedAt.getTime()) / DAY);
      }
      const med = median(intervals);
      const cadence = cadenceFromIntervalDays(med);

      /* regularity: how tightly intervals hug the median */
      const spread =
        intervals.length > 1
          ? Math.sqrt(intervals.reduce((s, x) => s + (x - med) ** 2, 0) / intervals.length) /
            Math.max(med, 1)
          : 0.5;
      const regularity = Math.max(0, 1 - Math.min(1, spread));
      const countScore = Math.min(1, cluster.length / 6);
      const confidence = Math.round((0.4 * countScore + 0.6 * regularity) * 100) / 100;

      const last = sorted[sorted.length - 1];
      const cadMs = CADENCE_MS[cadence] ?? (med > 0 ? med * DAY : null);

      subscriptions.push({
        displayName: cluster[0].merchantGuess,
        cadence,
        amountCents: Math.round(median(cluster.map((r) => r.amountCents))),
        currency: last.currency,
        firstSeenAt: sorted[0].chargedAt,
        lastChargeAt: last.chargedAt,
        nextRenewalEst: cadMs ? new Date(last.chargedAt.getTime() + cadMs) : null,
        lifetimeCents: cluster.reduce((s, r) => s + r.amountCents, 0),
        confidence,
        receiptIds: cluster.map((r) => r.id),
      });
    }
  }

  subscriptions.sort((a, b) => b.lifetimeCents - a.lifetimeCents);
  return { subscriptions, apparitionIds };
}
