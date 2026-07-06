import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

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
