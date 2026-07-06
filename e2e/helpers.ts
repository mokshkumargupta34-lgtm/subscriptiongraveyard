import type { BrowserContext } from "@playwright/test";

/* Sign in through the dev-only e2e credentials provider by driving the
   Auth.js REST endpoints directly; the session cookie lands in the
   browser context. */
export async function signInE2E(context: BrowserContext, email: string) {
  const req = context.request;
  const csrfRes = await req.get("/api/auth/csrf");
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const res = await req.post("/api/auth/callback/e2e", {
    form: { csrfToken, email },
  });
  if (res.status() >= 400) throw new Error(`e2e sign-in failed: ${res.status()}`);
}

/* Run a full scan via the SSE endpoint and return the raw event text. */
export async function runScanViaSSE(context: BrowserContext): Promise<string> {
  const res = await context.request.get("/api/app/scan/stream", { timeout: 110_000 });
  return await res.text();
}
