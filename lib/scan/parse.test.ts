import { describe, expect, it } from "vitest";
import { extractAmount, looksLikeReceipt, parseReceipt, parseSender } from "./parse";

const msg = (from: string, subject: string, snippet: string, date = "2026-06-01") => ({
  from,
  subject,
  snippet,
  internalDate: new Date(date),
});

/* fixtures across 10 merchants */
const FIXTURES = [
  msg("Netflix <info@account.netflix.com>", "Your Netflix receipt", "We received your payment of $15.49 for your monthly plan."),
  msg("Spotify <no-reply@spotify.com>", "Receipt for your Premium subscription", "Amount charged: $10.99. Next billing date Jul 1."),
  msg("Amazon.com <auto-confirm@amazon.com>", "Your Amazon Prime payment receipt", "Payment of $14.99 was charged to your card."),
  msg("Adobe <mail@mail.adobe.com>", "Your invoice from Adobe", "Invoice total: US$ 54.99 for Creative Cloud All Apps."),
  msg("Apple <no_reply@email.apple.com>", "Your receipt from Apple.", "iCloud+ 200GB. Total: $2.99"),
  msg("Google Payments <payments-noreply@google.com>", "Your Google One payment receipt", "You paid ₹130.00 for Google One 100 GB."),
  msg("NordVPN <billing@nordvpn.com>", "Payment confirmation", "Your renewal of €59.88 for the yearly plan succeeded."),
  msg("The New York Times <nytdirect@nytimes.com>", "Payment received", "Billed £4.25 for Basic Digital Access."),
  msg("GitHub <billing@github.com>", "[GitHub] Payment receipt", "GitHub Pro subscription: $4.00 charged."),
  msg("Audible <no-reply@audible.com>", "Your Audible membership renewal", "Membership billed at $14.95. 1 credit added."),
];

describe("looksLikeReceipt", () => {
  it("accepts all merchant fixtures", () => {
    for (const f of FIXTURES) expect(looksLikeReceipt(f)).toBe(true);
  });
  it("rejects non-billing and negative cases", () => {
    expect(looksLikeReceipt(msg("A <a@b.com>", "Lunch on Friday?", "See you at noon"))).toBe(false);
    expect(looksLikeReceipt(msg("Netflix <i@netflix.com>", "Your refund receipt", "We refunded $15.49"))).toBe(false);
    expect(looksLikeReceipt(msg("Bank <alerts@bank.com>", "Security alert", "New sign-in. Charge card ending 1234"))).toBe(false);
  });
});

describe("extractAmount", () => {
  it("parses symbols and codes", () => {
    expect(extractAmount("charged $15.49 today")).toEqual({ amountCents: 1549, currency: "USD" });
    expect(extractAmount("total €59.88")).toEqual({ amountCents: 5988, currency: "EUR" });
    expect(extractAmount("billed £4.25")).toEqual({ amountCents: 425, currency: "GBP" });
    expect(extractAmount("paid ₹130.00")).toEqual({ amountCents: 13000, currency: "INR" });
    expect(extractAmount("USD 1,234.56 due")).toEqual({ amountCents: 123456, currency: "USD" });
  });
  it("handles european separators", () => {
    expect(extractAmount("Rechnung: €1.234,56")).toEqual({ amountCents: 123456, currency: "EUR" });
  });
  it("returns null without an amount", () => {
    expect(extractAmount("thanks for your payment")).toBeNull();
  });
});

describe("parseSender", () => {
  it("strips mailer subdomains", () => {
    expect(parseSender("Netflix <info@account.netflix.com>").domain).toBe("netflix.com");
    expect(parseSender("Apple <no_reply@email.apple.com>").domain).toBe("apple.com");
  });
});

describe("parseReceipt", () => {
  it("parses every merchant fixture", () => {
    for (const f of FIXTURES) {
      const r = parseReceipt(f);
      expect(r, f.subject).not.toBeNull();
      expect(r!.amountCents).toBeGreaterThan(0);
      expect(r!.merchantGuess.length).toBeGreaterThan(1);
    }
  });
  it("prefers the merchant map over the display name", () => {
    const map = new Map([["netflix.com", "Netflix"]]);
    const r = parseReceipt(msg("NETFLIX BILLING <x@account.netflix.com>", "Your Netflix receipt", "payment of $15.49"), map);
    expect(r!.merchantGuess).toBe("Netflix");
  });
});
