import { describe, expect, it } from "vitest";
import { cadenceFromIntervalDays, groupReceipts } from "./group";

const r = (id: string, merchant: string, cents: number, date: string) => ({
  id,
  merchantGuess: merchant,
  amountCents: cents,
  currency: "USD",
  chargedAt: new Date(date),
});

describe("cadenceFromIntervalDays", () => {
  it("classifies intervals", () => {
    expect(cadenceFromIntervalDays(7)).toBe("weekly");
    expect(cadenceFromIntervalDays(30)).toBe("monthly");
    expect(cadenceFromIntervalDays(31)).toBe("monthly");
    expect(cadenceFromIntervalDays(365)).toBe("yearly");
    expect(cadenceFromIntervalDays(90)).toBe("unknown");
  });
});

describe("groupReceipts", () => {
  it("finds a monthly subscription from regular receipts", () => {
    const { subscriptions, apparitionIds } = groupReceipts([
      r("1", "Netflix", 1549, "2026-01-05"),
      r("2", "Netflix", 1549, "2026-02-04"),
      r("3", "Netflix", 1549, "2026-03-06"),
      r("4", "Netflix", 1549, "2026-04-05"),
    ]);
    expect(subscriptions).toHaveLength(1);
    const s = subscriptions[0];
    expect(s.cadence).toBe("monthly");
    expect(s.lifetimeCents).toBe(4 * 1549);
    expect(s.confidence).toBeGreaterThan(0.5);
    expect(s.nextRenewalEst).not.toBeNull();
    expect(apparitionIds).toHaveLength(0);
  });

  it("detects yearly cadence", () => {
    const { subscriptions } = groupReceipts([
      r("1", "NordVPN", 5988, "2024-05-01"),
      r("2", "NordVPN", 5988, "2025-05-02"),
      r("3", "NordVPN", 5988, "2026-05-01"),
    ]);
    expect(subscriptions[0].cadence).toBe("yearly");
  });

  it("tolerates ±15% price drift within one subscription", () => {
    const { subscriptions } = groupReceipts([
      r("1", "Spotify", 999, "2026-01-01"),
      r("2", "Spotify", 1099, "2026-02-01"),
      r("3", "Spotify", 1099, "2026-03-03"),
    ]);
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].lifetimeCents).toBe(999 + 1099 + 1099);
  });

  it("splits genuinely different amounts from the same merchant", () => {
    const { subscriptions, apparitionIds } = groupReceipts([
      r("1", "Apple", 299, "2026-01-01"),
      r("2", "Apple", 299, "2026-02-01"),
      r("3", "Apple", 2999, "2026-02-15"), /* one-off purchase */
    ]);
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].amountCents).toBe(299);
    expect(apparitionIds).toEqual(["3"]);
  });

  it("routes single receipts to the apparitions list", () => {
    const { subscriptions, apparitionIds } = groupReceipts([
      r("1", "Some Shop", 4200, "2026-03-01"),
    ]);
    expect(subscriptions).toHaveLength(0);
    expect(apparitionIds).toEqual(["1"]);
  });

  it("sorts subscriptions by lifetime damage", () => {
    const { subscriptions } = groupReceipts([
      r("1", "Small", 100, "2026-01-01"),
      r("2", "Small", 100, "2026-02-01"),
      r("3", "Big", 5000, "2026-01-01"),
      r("4", "Big", 5000, "2026-02-01"),
    ]);
    expect(subscriptions[0].displayName).toBe("Big");
  });
});
