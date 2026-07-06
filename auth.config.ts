import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

/* E2E-only sign-in: requires BOTH a non-production build AND an explicit
   env flag. Never enabled on Vercel. */
const e2eEnabled = () =>
  process.env.E2E_TEST === "1" && process.env.NODE_ENV !== "production";

/* Edge-safe config — used by middleware. No database imports here.
   Initial sign-in asks ONLY for identity (openid email profile);
   Gmail read access is a separate, incremental consent (see
   connectGmail in app/actions.ts). */
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { scope: "openid email profile" },
      },
    }),
    Credentials({
      id: "e2e",
      name: "E2E",
      credentials: { email: { label: "email" } },
      authorize(creds) {
        if (!e2eEnabled()) return null;
        const email = typeof creds?.email === "string" ? creds.email : "e2e@test.local";
        if (!email.endsWith("@test.local")) return null;
        return { id: `e2e-${email}`, email, name: "E2E Tester" };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/") ||
        pathname === "/settings" ||
        pathname.startsWith("/api/app/");
      if (!isProtected) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
