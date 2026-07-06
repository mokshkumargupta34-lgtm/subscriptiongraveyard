import { expect, test } from "@playwright/test";
import { runScanViaSSE, signInE2E } from "./helpers";

test.describe("happy path: login → scan → plots → bury → export", () => {
  test("full journey with mocked Gmail", async ({ context, page }) => {
    /* landing renders for anonymous visitors */
    await page.goto("/");
    await expect(page).toHaveTitle(/Subscription Graveyard/);

    /* /dashboard is gated before sign-in */
    const gate = await context.request.get("/dashboard", { maxRedirects: 0 });
    expect([302, 307]).toContain(gate.status());

    /* sign in via the dev-only e2e provider */
    await signInE2E(context, "e2e@test.local");

    /* scan fixtures through the real SSE pipeline */
    const events = await runScanViaSSE(context);
    expect(events).toContain('"phase":"done"');
    expect(events).toContain('"subscriptionsFound":3');

    /* plots render the three mocked merchants */
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your whole graveyard, on one screen" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "StreamFlix" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "GymRat+" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CloudVault" })).toBeVisible();
    await expect(page.getByText("TOTAL EXTRACTION")).toBeVisible();

    /* open the drawer, walk the bury flow (retry guards against a click
       landing a beat before the client component hydrates) */
    await page.waitForLoadState("networkidle");
    const card = page.getByRole("button", { name: /StreamFlix details/ });
    const dialog = page.getByRole("dialog");
    await expect(async () => {
      await card.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByText("RECEIPT HISTORY (6)")).toBeVisible();
    await page.getByRole("button", { name: "BURY IT → GUIDE" }).click();
    await expect(page.getByText("BURIAL RITE")).toBeVisible();
    await page.getByRole("button", { name: /I CANCELLED IT/ }).click();

    /* buried: close drawer, the tombstone wears the AT REST ribbon and the stat ticks up */
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.locator(".db-ribbon", { hasText: "AT REST" }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".db-stat", { hasText: "BURIED FOR GOOD" }).locator("b")).toHaveText("1");

    /* apparitions from the two one-off receipts */
    await expect(page.getByText(/single sightings awaiting review/)).toBeVisible();

    /* CSV export */
    const csv = await context.request.get("/api/app/export");
    expect(csv.status()).toBe(200);
    const body = await csv.text();
    expect(body).toContain('"name","status","cadence"');
    expect(body).toContain("StreamFlix");
    expect(body).toContain('"buried"');
  });

  test("mobile: landing scrub rig + dashboard cards at 390px", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.locator(".rig")).toBeVisible();
    const rigHeight = await page.locator(".rig").evaluate((el) => el.getBoundingClientRect().height);
    expect(rigHeight).toBeGreaterThan(844 * 5); /* 600vh mobile runway */

    await signInE2E(context, "e2e@test.local");
    await page.goto("/dashboard");
    await expect(page.getByText("TOTAL EXTRACTION")).toBeVisible();
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(noHScroll).toBe(true);
    await context.close();
  });
});

test.describe("error states", () => {
  test("token revoked mid-scan → re-consent prompt", async ({ context }) => {
    await signInE2E(context, "revoked@test.local");
    const events = await runScanViaSSE(context);
    expect(events).toContain('"phase":"error"');
    expect(events).toContain('"reconsent":true');
  });

  test("zero receipts found → empty state", async ({ context, page }) => {
    await signInE2E(context, "empty@test.local");
    const events = await runScanViaSSE(context);
    expect(events).toContain('"phase":"done"');
    expect(events).toContain('"subscriptionsFound":0');
    await page.goto("/dashboard");
    await expect(page.getByText("No spirits yet")).toBeVisible();
  });
});
