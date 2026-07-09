import type { Metadata } from "next";
/* Tailwind + shadcn tokens are imported ONLY here, so they stay scoped to
   /magic-ui and never touch the hand-styled landing/dashboard/login pages. */
import "../globals.css";

export const metadata: Metadata = {
  title: "Magic UI — installed components",
  description: "Every Magic UI component installed in this project, shown live.",
};

export default function MagicUILayout({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-screen bg-[#07071c] text-foreground antialiased">{children}</div>;
}
