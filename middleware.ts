import NextAuth from "next-auth";
import authConfig from "./auth.config";

/* Edge middleware: session-gates the app surfaces. The `authorized`
   callback in auth.config.ts decides; unauthenticated hits are sent
   to /login automatically. */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard", "/settings", "/api/app/:path*"],
};
