import type { NextConfig } from "next";

/* The cinematic landing page and its satellite pages are preserved
   byte-for-byte as static files in /public; routing maps clean URLs
   onto them. App routes (/api/*, future /dashboard, /login) take
   precedence automatically as they're added in later phases. */
const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/home.html" },
        { source: "/privacy", destination: "/privacy.html" },
        { source: "/terms", destination: "/terms.html" },
      ],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/signup", destination: "/login", permanent: true },
      { source: "/signup.html", destination: "/login", permanent: true },
      { source: "/home.html", destination: "/", permanent: false },
      { source: "/dashboard/dist/:path*", destination: "/dashboard", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              /* Next.js hydration + JSON-LD require inline scripts; Stripe.js for Phase 5.
                 'unsafe-eval' only in dev — Next's HMR/React-refresh needs it; prod does not. */
              `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV !== "production" ? "'unsafe-eval' " : ""}https://js.stripe.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://lh3.googleusercontent.com",
              "media-src 'self'",
              "connect-src 'self' https://api.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/media/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
