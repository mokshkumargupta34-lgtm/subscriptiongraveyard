import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/* Migrations use the DIRECT connection (port 5432) — the transaction
   pooler can't run DDL reliably. Falls back to DATABASE_URL if unset. */
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
