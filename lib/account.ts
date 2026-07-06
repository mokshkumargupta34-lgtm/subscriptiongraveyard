import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events, googleAccounts, users } from "@/db/schema";
import { decryptToken } from "./crypto";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export async function getGoogleAccount(userId: string) {
  return db.query.googleAccounts.findFirst({
    where: eq(googleAccounts.userId, userId),
  });
}

export function hasGmailScope(scope: string | null | undefined) {
  return !!scope?.includes(GMAIL_SCOPE);
}

/* Revoke our token with Google (best effort — the token may already be
   expired/revoked) and wipe stored token material. */
export async function revokeGoogle(userId: string) {
  const acct = await getGoogleAccount(userId);
  if (!acct) return;

  for (const enc of [acct.refreshTokenEnc, acct.accessTokenEnc]) {
    if (!enc) continue;
    try {
      const token = decryptToken(enc);
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }),
      });
      break; /* revoking the refresh token revokes the whole grant */
    } catch {
      /* best effort */
    }
  }

  await db
    .update(googleAccounts)
    .set({ accessTokenEnc: null, refreshTokenEnc: null, scope: null, tokenExpiresAt: null })
    .where(eq(googleAccounts.userId, userId));

  await db.insert(events).values({ userId, type: "gmail_disconnected" });
}

/* Full account deletion: revoke at Google, then cascade-delete every row. */
export async function deleteAccount(userId: string) {
  await revokeGoogle(userId);
  await db.delete(users).where(eq(users.id, userId));
}
