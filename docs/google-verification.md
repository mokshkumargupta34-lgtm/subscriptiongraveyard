# Google OAuth verification — submission kit

`gmail.readonly` is a **RESTRICTED scope**. Publishing the app (leaving Testing
mode) requires Google's app verification, Limited Use compliance, and — to serve
more than 100 users — an annual third-party **CASA security assessment**
(Cloud Application Security Assessment, currently Tier 2). Budget 2–6 weeks for
verification and plan the CASA before you need the user headroom.

**Interim strategy (recommended):** stay in *Testing* mode with the ≤100
test-user allowlist while verification is in review. Sign-ins keep working for
allowlisted users the whole time. Note: refresh tokens in Testing mode expire
every 7 days, so users re-consent weekly — verified/production apps don't.

---

## 1. Prerequisites checklist (state: mostly done)

- [x] Privacy policy live at https://subscriptiongraveyard.vercel.app/privacy
      **including the Limited Use disclosure verbatim**
- [x] Terms live at https://subscriptiongraveyard.vercel.app/terms
- [x] In-product revoke ("Disconnect & revoke") and full account deletion
      (cascade verified — see docs/dpa-notes.md)
- [x] Consent screen branding: app name, support email, links
- [ ] **Domain verification in Google Search Console** — verify
      `subscriptiongraveyard.vercel.app` (URL-prefix property; use the HTML-tag
      method and add the tag to `app/layout.tsx` or upload the HTML file to
      `public/`). Required before submitting.
- [ ] Demo video (script below) uploaded to YouTube (unlisted is fine)

## 2. OAuth consent screen copy

- **App name:** Subscription Graveyard
- **User-facing description:**
  > Subscription Graveyard finds recurring subscriptions hiding in your Gmail
  > receipts, shows what each one has cost you over its lifetime, and gives you
  > step-by-step cancellation guides. Access is read-only; raw emails are never
  > stored.

## 3. Scope justification (paste into the verification form)

**Requested scope:** `https://www.googleapis.com/auth/gmail.readonly`

> Subscription Graveyard's single user-facing feature is detecting recurring
> subscriptions from billing emails. With the user's explicit, separate consent
> we (1) call `users.messages.list` with search queries that match receipt,
> invoice, and renewal emails, and (2) call `users.messages.get` with
> **`format=metadata` only** (From, Subject, Date headers plus the snippet) to
> extract merchant, amount, currency, and charge date. We never download
> message bodies or attachments, never modify, send, or delete mail, and never
> persist raw email content — only the four parsed fields above and the Gmail
> message ID (for idempotent re-scans).
>
> **Why a narrower scope is insufficient:** `gmail.metadata` does not support
> the `q` search parameter on `users.messages.list`, which our receipt
> discovery depends on; without search we would have to enumerate the entire
> mailbox, reading vastly more data. `gmail.readonly` used with
> metadata-format reads is therefore the minimal scope that supports the
> feature.
>
> Limited Use: data is used only to provide the subscription-detection feature
> the user sees; no advertising use, no sale or transfer, no human access
> except with explicit consent for support or for security/legal reasons, and
> no use in training ML models.

## 4. Demo video script (~3 minutes, screen recording, English)

1. **(0:00)** Open https://subscriptiongraveyard.vercel.app — show the landing
   page and say what the product does in one sentence.
2. **(0:20)** Click "Exhume my inbox" → /login → **Sign in with Google**. Show
   the OAuth screen: point out only basic identity is requested at sign-in.
3. **(0:45)** Land on /settings. Click **CONNECT GMAIL →**. Show the second,
   incremental consent screen listing *"View your email messages and settings"*
   (gmail.readonly). Approve.
4. **(1:10)** Click **RUN THE FIRST SÉANCE →**. Narrate while the live counter
   runs: "the app lists receipt-like messages and reads only headers and
   snippets — format=metadata; bodies are never fetched."
5. **(1:40)** Open /dashboard. Show the detected subscriptions, open a
   tombstone's drawer: receipt history shows **dates and amounts only**.
6. **(2:10)** Show data handling claims: open /privacy, scroll to "What we
   store" and the Limited Use disclosure.
7. **(2:30)** Back to /settings → **DISCONNECT & REVOKE** — show the badge flip
   to NOT CONNECTED and mention the token is revoked at Google.
8. **(2:45)** Show **DELETE ACCOUNT & ALL DATA** and state that deletion
   cascades every stored row (verified by automated test).

## 5. Data-minimization audit (asserted against the code, July 2026)

| Claim | Evidence |
|---|---|
| Bodies/attachments never fetched | `lib/gmail.ts` uses `format=metadata` exclusively; repo-wide grep: zero `format=full` call sites |
| Raw content never persisted | `db/schema.ts` receipts table has no subject/snippet/body columns — merchant, amount, currency, date, message id only |
| Tokens encrypted at rest | AES-256-GCM (`lib/crypto.ts`), key from `TOKEN_ENC_KEY` env; tokens never sent to the browser |
| Tokens never logged | single `console.error` in the app logs `err.message` only; Gmail errors never embed token material |
| LLM parsing | **not implemented** — parsing is fully deterministic. If `LLM_PARSE` is ever built, snippets must be stripped of emails/names first (see fullstack prompt Phase 3) |
| Revoke + delete in product | `/settings` — revoke calls `oauth2.googleapis.com/revoke`, delete cascades (verified: `scripts/test-deletion-cascade.ts`) |

## 6. Submission steps

1. Google Cloud Console → **Google Auth Platform → Verification Center** (or
   OAuth consent screen → *Publish app*).
2. Fill the verification form with §2–§3 above, link the demo video, confirm
   privacy-policy URL.
3. Respond to the verification team's emails (they usually iterate 1–3 times).
4. When Google requests the CASA assessment (at >100 users), pick an
   authorized lab (e.g., TAC Security, DEKRA), run the Tier 2 self-scan +
   attestation, upload the Letter of Validation.
