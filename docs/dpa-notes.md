# Data protection notes (internal)

## What we hold, per user

| Table | Contents | Sensitivity |
|---|---|---|
| `users` | email, name, avatar URL, plan | identity |
| `google_accounts` | Google sub, OAuth tokens (AES-256-GCM encrypted), scope, expiry | credentials |
| `receipts` | merchant guess, amount, currency, charge date, Gmail message ID | financial metadata |
| `subscriptions` | derived clusters of the above | financial metadata |
| `scans` | counters + timestamps + error strings | operational |
| `events` | burial/alert/scan log entries (ids only in payloads) | operational |
| `waitlist` | email | identity |

**Never held:** email bodies, attachments, subjects, snippets, or any raw
message content. Receipts are pruned to parsed fields at ingestion time — the
raw material only ever exists in memory during a scan.

## Retention

- Parsed receipts + subscriptions: kept while the account exists (they ARE the product).
- `scans` rows: prune after 90 days (TODO: add to nightly cron).
- OAuth tokens: overwritten on refresh; nulled immediately on disconnect.
- Waitlist: until launch invite or deletion request.

## Deletion

- **In-product:** /settings → "Delete account & all data" → revokes the Google
  grant at `oauth2.googleapis.com/revoke`, then `DELETE FROM users` — every
  other table references `users.id` with `ON DELETE CASCADE`.
- **Verified:** `npx tsx scripts/test-deletion-cascade.ts` creates a synthetic
  user with a row in every table, deletes the user, and asserts zero survivors.
  Last run: 2026-07-06 — `CASCADE VERIFIED ✓`.
- Backups: Supabase free-tier PITR/backups age out within days; document
  30-day worst-case in the privacy policy (already stated).

## Token handling

- AES-256-GCM via `lib/crypto.ts`; 32-byte key in `TOKEN_ENC_KEY` (never in git).
- Tokens decrypt only inside server code paths (`lib/gmail.ts`, revoke flow).
- Testing-mode refresh tokens expire after 7 days — expect `GmailAuthError`
  re-consent prompts until the app is verified.

## Incident basics

If `TOKEN_ENC_KEY` or the database is suspected compromised: rotate
`TOKEN_ENC_KEY` (stored tokens become undecryptable — users must reconnect
Gmail, acceptable), reset the DB password, revoke all grants via the Google
Cloud console, notify affected users.
