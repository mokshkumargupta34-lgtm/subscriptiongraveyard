import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Inter, JetBrains_Mono, Playfair_Display, Spectral } from "next/font/google";

/* dashboard type system: luxury editorial serif + clean modern sans */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

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

/* dashboard display serif — matches the high-contrast headline in the
   design mock ("Your whole graveyard, on one screen.") */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Subscription Graveyard",
  description:
    "Connect Gmail read-only, exhume every recurring subscription hiding in your inbox, see lifetime spend, and bury them with one-click cancellation guides.",
} satisfies Metadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${spectral.variable} ${playfair.variable} ${jetbrains.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body style={{ margin: 0, background: "#07071c" }}>{children}</body>
    </html>
  );
}
