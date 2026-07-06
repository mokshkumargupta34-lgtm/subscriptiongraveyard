# Service setup guide — Subscription Graveyard (Phases 1–7)

Everything external the full-stack build needs, in the order you should create it.
When you're done, you'll have filled every variable in `.env.example`.

---

## 1. Supabase (Postgres database) — needed for Phase 1

1. Go to **https://supabase.com** → *Start your project* → sign in with GitHub.
2. **New project** → organization (create one if asked) →
   - Name: `subscription-graveyard`
   - **Database password: generate a strong one and SAVE IT** (you can't view it again, only reset)
   - Region: pick the closest to you (e.g., `ap-south-1` Mumbai)
   - Plan: Free
3. Wait ~2 minutes for provisioning.
4. Click the **Connect** button (top bar) → tab **ORMs → Drizzle** (or Connection String → URI). You need **two** strings:
   - **Transaction pooler** (port **6543**) → this is `DATABASE_URL` — serverless functions on Vercel must use the pooler.
   - **Direct connection** (port **5432**) → this is `DIRECT_URL` — used only by `drizzle-kit` for migrations.
5. Replace `[YOUR-PASSWORD]` in both strings with the password from step 2.

```
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

> We use Supabase ONLY as a Postgres host. Auth is handled by Auth.js + Google,
> not Supabase Auth — don't enable anything else there.

---

## 2. Google Cloud — OAuth + Gmail API — needed for Phase 2

### 2a. Project + Gmail API
1. **https://console.cloud.google.com** → project picker (top-left) → **New project** → name `Subscription Graveyard` → Create → select it.
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.

### 2b. OAuth consent screen
3. **APIs & Services → OAuth consent screen** (now called *Google Auth Platform*):
   - User type: **External** → Create
   - App name: `Subscription Graveyard`; support email: your Gmail
   - App domain: `https://subscriptiongraveyard.vercel.app`
   - **Privacy policy**: `https://subscriptiongraveyard.vercel.app/privacy`
   - **Terms**: `https://subscriptiongraveyard.vercel.app/terms`
     (both pages already exist — Google requires them)
   - Developer contact: your Gmail → Save
4. **Scopes** → *Add or remove scopes* → tick:
   - `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
   - `https://www.googleapis.com/auth/gmail.readonly` ← listed under **Restricted scopes**
5. **Test users** → add your own Gmail (and any friends who'll test; max 100).
6. **Publishing status: leave it in “Testing.”**
   - In Testing mode, only test users can sign in — that's fine until launch.
   - Going public with `gmail.readonly` requires Google's app verification and
     (past 100 users) a CASA security assessment. That's Phase 6 paperwork; don't
     start it until the product works.
   - One quirk of Testing mode: refresh tokens expire after 7 days, so you'll
     re-consent weekly during development. Normal and expected.

### 2c. OAuth client credentials
7. **APIs & Services → Credentials → + Create credentials → OAuth client ID**:
   - Type: **Web application**, name `sg-web`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://subscriptiongraveyard.vercel.app`
   - Authorized redirect URIs (must match EXACTLY):
     - `http://localhost:3000/api/auth/callback/google`
     - `https://subscriptiongraveyard.vercel.app/api/auth/callback/google`
8. Copy the **Client ID** → `GOOGLE_CLIENT_ID`, **Client secret** → `GOOGLE_CLIENT_SECRET`.

---

## 3. Generated secrets — one command each

Run in Git Bash (any folder):

```bash
node -e "console.log('AUTH_SECRET='    + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('TOKEN_ENC_KEY='  + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('CRON_SECRET='    + require('crypto').randomBytes(24).toString('hex'))"
```

- `AUTH_SECRET` — Auth.js session signing
- `TOKEN_ENC_KEY` — AES-256-GCM key for encrypting Google tokens at rest (32 bytes hex)
- `CRON_SECRET` — guards `/api/cron/rescan` so only Vercel Cron can call it

---

## 4. Stripe ($4/mo billing) — needed for Phase 5

1. **https://dashboard.stripe.com** → create account → stay in **Test mode** (toggle top-right).
2. **Product catalog → + Add product**:
   - Name `Gravekeeper` → Recurring → **$4.00 / month** → Save
   - Open the product → copy the price's ID (`price_...`) → `STRIPE_PRICE_ID`
3. **Developers → API keys** → copy **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
4. **After the app is deployed** (Phase 5): **Developers → Webhooks → + Add endpoint**
   - URL: `https://subscriptiongraveyard.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`
5. Real money later: activate the account (KYC), flip to Live mode, recreate the
   product/price there, and swap the three Stripe vars for their live values.

---

## 5. Resend (renewal-alert emails) — needed for Phase 4 alerts

1. **https://resend.com** → sign up → **API Keys → Create** → `RESEND_API_KEY`
2. Without a custom domain you can only send from `onboarding@resend.dev` **to your
   own email** — enough for development. For real users, add a domain under
   **Domains** and set the DNS records they show you.

---

## 6. Anthropic key (optional — smarter receipt parsing)

**https://console.anthropic.com** → API Keys → create → `ANTHROPIC_API_KEY`,
and set `LLM_PARSE=true`. Skip this to use regex-only parsing.

---

## 7. Where the variables go

**Local dev** — `.env.local` in the project root (gitignored):

```
DATABASE_URL=...
DIRECT_URL=...
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TOKEN_ENC_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID=...
RESEND_API_KEY=...
CRON_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Vercel** — Project → **Settings → Environment Variables** → add each one for
*Production* and *Preview* (`NEXT_PUBLIC_APP_URL` = `https://subscriptiongraveyard.vercel.app`
in Production). Redeploy after adding.

---

## Minimum to start Phase 1–2

| Have this | Unlocks |
|---|---|
| `DATABASE_URL` + `DIRECT_URL` | Phase 1 (schema, waitlist, seeds) |
| `GOOGLE_CLIENT_ID/SECRET` + `AUTH_SECRET` + `TOKEN_ENC_KEY` | Phase 2 (sign-in, Gmail connect) |
| Stripe trio | Phase 5 only |
| `RESEND_API_KEY` | Phase 4 alerts only |
