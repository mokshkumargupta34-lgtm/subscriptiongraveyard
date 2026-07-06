import type { GmailMessageMeta } from "./gmail";

/* Mocked Gmail for local dev + E2E (GMAIL_MOCK=1). Behavior is keyed by
   the signed-in user's email so error states are testable:
     revoked@test.local — token refresh failure (re-consent path)
     empty@test.local   — inbox with no receipts
     anything else      — 3 recurring merchants + 2 one-off receipts */

const DAY = 86_400_000;

function monthly(name: string, domain: string, amount: string, months: number, day: number): GmailMessageMeta[] {
  const out: GmailMessageMeta[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, day);
    out.push({
      id: `mock-${domain}-${i}`,
      from: `${name} <billing@${domain}>`,
      subject: `Your ${name} receipt`,
      snippet: `We received your payment of ${amount} for your monthly plan. Thank you!`,
      internalDate: d,
    });
  }
  return out;
}

export function mockMessages(): GmailMessageMeta[] {
  return [
    ...monthly("StreamFlix", "streamflix.example", "$15.49", 6, 5),
    ...monthly("GymRat+", "gymrat.example", "$29.00", 5, 12),
    ...monthly("CloudVault", "cloudvault.example", "$9.99", 6, 20),
    {
      id: "mock-oneoff-1",
      from: "Gadget Shop <orders@gadgets.example>",
      subject: "Order confirmation — payment received",
      snippet: "Payment of $89.00 received for your order #1234.",
      internalDate: new Date(Date.now() - 40 * DAY),
    },
    {
      id: "mock-oneoff-2",
      from: "Course Hut <billing@coursehut.example>",
      subject: "Your invoice",
      snippet: "Invoice total: $24.00. Thanks for learning with us.",
      internalDate: new Date(Date.now() - 200 * DAY),
    },
  ];
}

export const isMockEnabled = () => process.env.GMAIL_MOCK === "1";
