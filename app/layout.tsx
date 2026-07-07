import type { Metadata } from "next";
import { Cinzel, Spectral } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata = {
  title: "Subscription Graveyard",
  description:
    "Connect Gmail read-only, exhume every recurring subscription hiding in your inbox, see lifetime spend, and bury them with one-click cancellation guides.",
} satisfies Metadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${spectral.variable}`}>
      <body style={{ margin: 0, background: "#07071c" }}>{children}</body>
    </html>
  );
}
