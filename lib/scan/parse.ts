/* Deterministic receipt parsing from headers + snippet ONLY.
   Input is never persisted — only the parsed fields below are. */

export interface ParsedReceipt {
  merchantGuess: string;
  amountCents: number;
  currency: string;
  chargedAt: Date;
  parsedFrom: "subject" | "body";
}

export interface MessageLike {
  from: string;
  subject: string;
  snippet: string;
  internalDate: Date;
}

/* cheap classifier: does this even look like a billing email? */
const BILLING_RE =
  /\b(receipt|invoice|payment|renew(?:al|ed|s)?|subscription|billed|billing|charge[ds]?|order confirmation|your (?:membership|plan)|statement|purchase)\b/i;

/* obvious non-charges we should skip even if they mention money */
const NEGATIVE_RE =
  /\b(refund(?:ed)?|payment failed|declined|free trial start|verify your|password|security alert|newsletter)\b/i;

export function looksLikeReceipt(msg: Pick<MessageLike, "subject" | "from" | "snippet">): boolean {
  const hay = `${msg.subject} ${msg.snippet}`;
  return BILLING_RE.test(hay) && !NEGATIVE_RE.test(hay);
}

const SYMBOLS: Record<string, string> = { $: "USD", "€": "EUR", "£": "GBP", "₹": "INR" };

const AMOUNT_RE =
  /(USD|EUR|GBP|INR|Rs\.?|[$€£₹])\s?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d{1,4}(?:[.,]\d{2})?)/;

export function extractAmount(text: string): { amountCents: number; currency: string } | null {
  const m = text.match(AMOUNT_RE);
  if (!m) return null;
  const currency = SYMBOLS[m[1]] ?? (m[1].startsWith("Rs") ? "INR" : m[1].toUpperCase());

  let num = m[2];
  /* normalize 1.234,56 and 1,234.56 to plain float text */
  const lastSep = Math.max(num.lastIndexOf("."), num.lastIndexOf(","));
  if (lastSep >= 0 && num.length - lastSep - 1 === 2) {
    num = num.slice(0, lastSep).replace(/[.,]/g, "") + "." + num.slice(lastSep + 1);
  } else {
    num = num.replace(/[.,]/g, "");
  }
  const value = parseFloat(num);
  if (!isFinite(value) || value <= 0 || value > 100000) return null;
  return { amountCents: Math.round(value * 100), currency };
}

/* "Netflix <info@account.netflix.com>" → { name: "Netflix", domain: "netflix.com" } */
export function parseSender(from: string): { name: string; domain: string } {
  const email = from.match(/<([^>]+)>/)?.[1] ?? (from.includes("@") ? from.trim() : "");
  const rawDomain = email.split("@")[1]?.toLowerCase().trim() ?? "";
  /* strip common mailer subdomains: account.netflix.com → netflix.com */
  const parts = rawDomain.split(".");
  const domain = parts.length > 2 ? parts.slice(-2).join(".") : rawDomain;
  let name = from.replace(/<[^>]*>/, "").replace(/["']/g, "").trim();
  if (!name) name = domain.split(".")[0] ?? "unknown";
  return { name, domain };
}

export function parseReceipt(
  msg: MessageLike,
  merchantByDomain: Map<string, string> = new Map()
): ParsedReceipt | null {
  if (!looksLikeReceipt(msg)) return null;

  const fromSubject = extractAmount(msg.subject);
  const amount = fromSubject ?? extractAmount(msg.snippet);
  if (!amount) return null;

  const sender = parseSender(msg.from);
  const merchantGuess = merchantByDomain.get(sender.domain) ?? sender.name;

  return {
    merchantGuess,
    amountCents: amount.amountCents,
    currency: amount.currency,
    chargedAt: msg.internalDate,
    parsedFrom: fromSubject ? "subject" : "body",
  };
}
