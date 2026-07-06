import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const cadenceEnum = pgEnum("cadence", ["monthly", "yearly", "weekly", "unknown"]);
export const subStatusEnum = pgEnum("sub_status", ["active", "buried", "paused"]);
export const parsedFromEnum = pgEnum("parsed_from", ["subject", "body", "structured"]);
export const scanStatusEnum = pgEnum("scan_status", ["running", "finished", "failed"]);
export const planEnum = pgEnum("plan", ["free", "gravekeeper"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  plan: planEnum("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const googleAccounts = pgTable("google_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  googleSub: text("google_sub").notNull().unique(),
  /* tokens are AES-256-GCM encrypted with TOKEN_ENC_KEY before they touch the DB */
  accessTokenEnc: text("access_token_enc"),
  refreshTokenEnc: text("refresh_token_enc"),
  scope: text("scope"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  category: text("category").notNull(),
});

export const cancelGuides = pgTable("cancel_guides", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  /* steps: [{ step: 1, text: "..." }, ...] */
  steps: jsonb("steps").notNull(),
  url: text("url"),
  phone: text("phone"),
  difficulty: text("difficulty").notNull().default("easy"),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantId: uuid("merchant_id").references(() => merchants.id, { onDelete: "set null" }),
  displayName: text("display_name").notNull(),
  cadence: cadenceEnum("cadence").notNull().default("unknown"),
  amountCents: integer("amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
  lastChargeAt: timestamp("last_charge_at", { withTimezone: true }),
  nextRenewalEst: timestamp("next_renewal_est", { withTimezone: true }),
  status: subStatusEnum("status").notNull().default("active"),
  lifetimeCents: integer("lifetime_cents").notNull().default(0),
  confidence: real("confidence").notNull().default(0),
  alertsEnabled: boolean("alerts_enabled").notNull().default(true),
  /* "Not a subscription" — kept (not deleted) so re-scans can't resurrect it */
  dismissed: boolean("dismissed").notNull().default(false),
});

/* NEVER stores raw email content — parsed fields + the Gmail message id only. */
export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
    gmailMessageId: text("gmail_message_id").notNull(),
    merchantGuess: text("merchant_guess"),
    amountCents: integer("amount_cents"),
    currency: text("currency").default("USD"),
    chargedAt: timestamp("charged_at", { withTimezone: true }),
    parsedFrom: parsedFromEnum("parsed_from").notNull().default("subject"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("receipts_gmail_msg_unique").on(t.userId, t.gmailMessageId)]
);

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  messagesSeen: integer("messages_seen").notNull().default(0),
  receiptsFound: integer("receipts_found").notNull().default(0),
  status: scanStatusEnum("status").notNull().default("running"),
  error: text("error"),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
