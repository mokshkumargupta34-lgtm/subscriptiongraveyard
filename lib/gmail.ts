import { eq } from "drizzle-orm";
import { db } from "@/db";
import { googleAccounts } from "@/db/schema";
import { decryptToken, encryptToken } from "./crypto";

/* Gmail REST access with automatic token refresh and quota backoff.
   Uses plain fetch — no SDK. Only messages.list / messages.get
   (format=metadata) are ever called: we read headers + snippet,
   never full bodies, and nothing is ever written. */

export class GmailAuthError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "GmailAuthError";
  }
}

async function refreshAccessToken(userId: string, refreshTokenEnc: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: decryptToken(refreshTokenEnc),
    }),
  });

  if (!res.ok) {
    /* invalid_grant = user revoked us (or 7-day testing-mode expiry) */
    throw new GmailAuthError(`token refresh failed (${res.status}) — re-consent required`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  await db
    .update(googleAccounts)
    .set({
      accessTokenEnc: encryptToken(data.access_token),
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    })
    .where(eq(googleAccounts.userId, userId));

  return data.access_token;
}

async function mockEmail(userId: string): Promise<string> {
  const { users } = await import("@/db/schema");
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return u?.email ?? "";
}

export async function getAccessToken(userId: string): Promise<string> {
  if (process.env.GMAIL_MOCK === "1") {
    const email = await mockEmail(userId);
    if (email.startsWith("revoked@")) {
      throw new GmailAuthError("token refresh failed (mock) — re-consent required");
    }
    return `mock:${email}`;
  }
  const acct = await db.query.googleAccounts.findFirst({
    where: eq(googleAccounts.userId, userId),
  });
  if (!acct?.scope?.includes("gmail.readonly")) {
    throw new GmailAuthError("Gmail not connected");
  }

  const fresh =
    acct.accessTokenEnc &&
    acct.tokenExpiresAt &&
    acct.tokenExpiresAt.getTime() - Date.now() > 60_000;

  if (fresh) return decryptToken(acct.accessTokenEnc!);
  if (!acct.refreshTokenEnc) throw new GmailAuthError("no refresh token — re-consent required");
  return refreshAccessToken(userId, acct.refreshTokenEnc);
}

/* fetch with exponential backoff on 429/5xx (Gmail per-user quota) */
export async function gmailFetch(token: string, path: string): Promise<Response> {
  let delay = 500;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) throw new GmailAuthError("access token rejected");
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    return res;
  }
}

export interface GmailMessageMeta {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  internalDate: Date;
}

export async function listMessageIds(
  token: string,
  q: string,
  maxTotal: number,
  onPage?: (count: number) => void | Promise<void>
): Promise<string[]> {
  if (token.startsWith("mock:")) {
    if (token.includes("empty@")) return [];
    const { mockMessages } = await import("./gmail-mock");
    return mockMessages().map((m) => m.id).slice(0, maxTotal);
  }
  const ids: string[] = [];
  let pageToken: string | undefined;
  while (ids.length < maxTotal) {
    const params = new URLSearchParams({ q, maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await gmailFetch(token, `/messages?${params}`);
    if (!res.ok) break;
    const data = (await res.json()) as {
      messages?: Array<{ id: string }>;
      nextPageToken?: string;
    };
    for (const m of data.messages ?? []) ids.push(m.id);
    await onPage?.(ids.length);
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return ids.slice(0, maxTotal);
}

export async function getMessageMeta(token: string, id: string): Promise<GmailMessageMeta | null> {
  if (token.startsWith("mock:")) {
    const { mockMessages } = await import("./gmail-mock");
    return mockMessages().find((m) => m.id === id) ?? null;
  }
  const res = await gmailFetch(
    token,
    `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    id: string;
    snippet?: string;
    internalDate?: string;
    payload?: { headers?: Array<{ name: string; value: string }> };
  };
  const header = (name: string) =>
    data.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
  return {
    id: data.id,
    from: header("From"),
    subject: header("Subject"),
    snippet: data.snippet ?? "",
    internalDate: new Date(Number(data.internalDate ?? Date.now())),
  };
}
