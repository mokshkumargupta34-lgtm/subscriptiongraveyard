import { NextResponse } from "next/server";
import { db } from "@/db";
import { waitlist } from "@/db/schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.length > 320) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  try {
    await db
      .insert(waitlist)
      .values({ email: email.trim().toLowerCase() })
      .onConflictDoNothing({ target: waitlist.email });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waitlist insert failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "storage unavailable" }, { status: 503 });
  }
}
