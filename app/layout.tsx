import type { Metadata } from "next";

export const metadata = {
  title: "Subscription Graveyard",
  description:
    "Connect Gmail read-only, exhume every recurring subscription hiding in your inbox, see lifetime spend, and bury them with one-click cancellation guides.",
} satisfies Metadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#07071c" }}>{children}</body>
    </html>
  );
}
