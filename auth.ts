import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import authConfig from "./auth.config";
import { db } from "./db";
import { googleAccounts, users } from "./db/schema";
import { encryptToken } from "./lib/crypto";

/* Full auth — Node runtime only (route handlers, server actions).
   On every Google sign-in (initial or incremental Gmail consent) we
   upsert the user and capture the freshest tokens, encrypted at rest. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account, profile }) {
      /* E2E provider (dev-only, see auth.config.ts): upsert a plain user */
      if (account?.provider === "e2e") {
        if (process.env.E2E_TEST !== "1" || process.env.NODE_ENV === "production" || !user.email) {
          return false;
        }
        await db
          .insert(users)
          .values({ email: user.email.toLowerCase(), name: user.name ?? null })
          .onConflictDoNothing({ target: users.email });
        return true;
      }

      if (account?.provider !== "google" || !user.email) return false;

      const [dbUser] = await db
        .insert(users)
        .values({
          email: user.email.toLowerCase(),
          name: user.name ?? null,
          image: user.image ?? null,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { name: user.name ?? null, image: user.image ?? null },
        })
        .returning({ id: users.id });

      const googleSub = (profile?.sub ?? account.providerAccountId) as string;
      await db
        .insert(googleAccounts)
        .values({
          userId: dbUser.id,
          googleSub,
          accessTokenEnc: account.access_token ? encryptToken(account.access_token) : null,
          refreshTokenEnc: account.refresh_token ? encryptToken(account.refresh_token) : null,
          scope: account.scope ?? null,
          tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
        })
        .onConflictDoUpdate({
          target: googleAccounts.googleSub,
          set: {
            userId: dbUser.id,
            accessTokenEnc: account.access_token ? encryptToken(account.access_token) : undefined,
            /* Google only returns a refresh token on prompt=consent —
               never overwrite a stored one with null */
            ...(account.refresh_token
              ? { refreshTokenEnc: encryptToken(account.refresh_token) }
              : {}),
            scope: account.scope ?? undefined,
            tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
          },
        });

      return true;
    },

    async jwt({ token, user, trigger }) {
      /* stamp our internal user id into the JWT once at sign-in */
      if ((trigger === "signIn" || trigger === "signUp") && user?.email) {
        const row = await db.query.users.findFirst({
          where: eq(users.email, user.email.toLowerCase()),
          columns: { id: true },
        });
        if (row) token.userId = row.id;
      }
      return token;
    },

    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});
