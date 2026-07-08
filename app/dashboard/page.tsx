import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Banknote,
  Download,
  Gem,
  Ghost,
  LayoutDashboard,
  Rows3,
  Settings,
  Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { getGoogleAccount, hasGmailScope } from "@/lib/account";
import { computeStats, getApparitions, getDashboardData, getMonthlyExtraction } from "@/lib/subs";
import { Plots } from "./plots";
import { SeanceCard } from "./seance-card";
import { GhostLayer } from "./ghosts/GhostLayer";
import "./dashboard.css";

export const metadata: Metadata = { title: "Your plots — Subscription Graveyard" };
export const dynamic = "force-dynamic";

const usd = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });

function Tombstone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 21V10a6 6 0 0 1 12 0v11" />
      <path d="M9 12h6M12 9v6" strokeLinecap="round" />
      <path d="M3 21h18" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#top" },
  { icon: Sparkles, label: "Séances", href: "#seance" },
  { icon: Rows3, label: "Plots", href: "#plots" },
  { icon: Ghost, label: "Apparitions", href: "#apparitions" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [subs, apparitions, acct, extraction] = await Promise.all([
    getDashboardData(session.user.id),
    getApparitions(session.user.id),
    getGoogleAccount(session.user.id),
    getMonthlyExtraction(session.user.id),
  ]);
  const stats = computeStats(subs);
  const gmailConnected = hasGmailScope(acct?.scope);

  return (
    <div className="db-shell" id="top">
      {/* living graveyard — decorative, behind all content */}
      <GhostLayer />

      {/* ---------- sidebar ---------- */}
      <aside className="db-side">
        <a className="db-side__brand" href="/">
          <svg viewBox="0 0 64 80" aria-hidden>
            <path d="M32 4C18 4 8 16 8 32v40c0 3 4 5 6 3l5-5 5 5c2 2 6 2 8 0l5-5 5 5c2 2 6 0 6-3V32C56 16 46 4 32 4z" fill="none" stroke="#8d86c9" strokeWidth="3" />
            <path d="M32 18v26M24 28h16" stroke="#8d86c9" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>
            SUBSCRIPTION
            <br />
            GRAVEYARD
          </span>
        </a>

        <nav className="db-side__nav" aria-label="Dashboard">
          {NAV.map((n, i) => (
            <a key={n.label} href={n.href} className={i === 0 ? "active" : undefined}>
              <n.icon aria-hidden />
              {n.label}
            </a>
          ))}
        </nav>

        <div className="db-protip">
          <div className="db-protip__art" aria-hidden>
            <img src="/media/dash-protip.jpg" alt="" />
          </div>
          <p className="db-protip__title">Pro Tip</p>
          <p className="db-protip__body">Run your first séance to summon your data.</p>
          <a className="db-protip__btn" href="#seance">
            <Sparkles aria-hidden /> Run Séance →
          </a>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <div className="db-main-col">
        <header className="db-hero">
          <div className="db-hero__art" aria-hidden />
          <div className="db-hero__actions">
            <a className="db-chip" href="/api/app/export">
              <Download aria-hidden /> Export CSV
            </a>
            <a className="db-chip" href="/settings">
              <Settings aria-hidden /> Settings
            </a>
            <span className="db-avatar" title={session.user.name ?? session.user.email ?? "You"}>
              <Ghost aria-hidden />
            </span>
          </div>
          <p className="db-kicker">THE RECKONING · LIVE</p>
          <h1 className="db-h1">
            Your whole graveyard, on <em>one screen.</em>
          </h1>
          <p className="db-hero__sub">Track. Uncover. Reclaim.</p>
        </header>

        <main className="db-main">
          <div className="db-stats">
            <div className="db-stat">
              <span className="db-ico db-ico--green"><Banknote aria-hidden /></span>
              <div>
                <b>{usd(stats.totalExtractionCents)}</b>
                <span className="lbl">TOTAL EXTRACTION</span>
                <span className="sub sub--green">All-time extracted</span>
              </div>
            </div>
            <div className="db-stat">
              <span className="db-ico db-ico--violet"><Ghost aria-hidden /></span>
              <div>
                <b>{stats.activeCount}</b>
                <span className="lbl">ACTIVE SPIRITS</span>
                <span className="sub">Subscriptions live</span>
              </div>
            </div>
            <div className="db-stat">
              <span className="db-ico db-ico--blue"><Tombstone /></span>
              <div>
                <b>{stats.buriedCount}</b>
                <span className="lbl">BURIED FOR GOOD</span>
                <span className="sub">Canceled &amp; forgotten</span>
              </div>
            </div>
            <div className="db-stat">
              <span className="db-ico db-ico--teal"><Gem aria-hidden /></span>
              <div>
                <b>{usd(stats.recoveredPerYearCents)}</b>
                <span className="lbl">RECOVERED PER YEAR</span>
                <span className="sub sub--green">Money back in your pocket</span>
              </div>
            </div>
          </div>

          <SeanceCard gmailConnected={gmailConnected} hasSubs={subs.length > 0} />

          <Plots subs={subs} apparitions={apparitions} extraction={extraction} />

          <p className="db-foot db-mono">SUBSCRIPTION GRAVEYARD · THE RECKONING, LIVE</p>
        </main>
      </div>
    </div>
  );
}
