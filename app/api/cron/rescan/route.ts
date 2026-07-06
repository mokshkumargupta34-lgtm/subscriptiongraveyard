import { NextResponse } from "next/server";
import { isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { googleAccounts } from "@/db/schema";
import { runScan } from "@/lib/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* Nightly re-scan for every connected user (Vercel Cron, 03:00 UTC).
   Guarded by CRON_SECRET. */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const connected = await db
    .select({ userId: googleAccounts.userId, scope: googleAccounts.scope })
    .from(googleAccounts)
    .where(isNotNull(googleAccounts.refreshTokenEnc));

  const results: Array<{ userId: string; ok: boolean; error?: string }> = [];
  for (const acct of connected) {
    if (!acct.scope?.includes("gmail.readonly")) continue;
    try {
      const p = await runScan(acct.userId);
      results.push({ userId: acct.userId, ok: true });
      void p;
    } catch (err) {
      results.push({
        userId: acct.userId,
        ok: false,
        error: err instanceof Error ? err.message : "failed",
      });
    }
  }

  return NextResponse.json({ scanned: results.length, results });
}
