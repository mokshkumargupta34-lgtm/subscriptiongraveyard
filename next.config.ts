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
        { source: "/login", destination: "/login.html" },
        { source: "/privacy", destination: "/privacy.html" },
        { source: "/terms", destination: "/terms.html" },
        { source: "/dashboard", destination: "/dashboard/index.html" },
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
