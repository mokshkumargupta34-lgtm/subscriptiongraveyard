import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGoogleAccount, hasGmailScope } from "@/lib/account";
import { computeStats, getApparitions, getDashboardData } from "@/lib/subs";
import { ScanCard } from "@/app/settings/scan-card";
import { Plots } from "./plots";
import "./dashboard.css";

export const metadata: Metadata = { title: "Your plots — Subscription Graveyard" };
export const dynamic = "force-dynamic";

const usd = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [subs, apparitions, acct] = await Promise.all([
    getDashboardData(session.user.id),
    getApparitions(session.user.id),
    getGoogleAccount(session.user.id),
  ]);
  const stats = computeStats(subs);
  const gmailConnected = hasGmailScope(acct?.scope);

  return (
    <div className="db-body">
      <header className="db-top">
        <a className="brand" href="/">SUBSCRIPTION GRAVEYARD</a>
        <nav aria-label="Dashboard">
          <a className="db-btn db-btn--ghost" href="/api/app/export">EXPORT CSV</a>
          <a className="db-btn db-btn--ghost" href="/settings">SETTINGS</a>
        </nav>
      </header>

      <main className="db-main">
        <p className="db-kicker">THE RECKONING · LIVE</p>
        <h1 className="db-h1">Your whole graveyard, on one screen</h1>

        <div className="db-stats">
          <div className="db-stat">
            <b>{usd(stats.totalExtractionCents)}</b>
            <span>TOTAL EXTRACTION</span>
          </div>
          <div className="db-stat db-stat--plain">
            <b>{stats.activeCount}</b>
            <span>ACTIVE SPIRITS</span>
          </div>
          <div className="db-stat db-stat--plain">
            <b>{stats.buriedCount}</b>
            <span>BURIED FOR GOOD</span>
          </div>
          <div className="db-stat">
            <b>{usd(stats.recoveredPerYearCents)}</b>
            <span>RECOVERED PER YEAR</span>
          </div>
        </div>

        <div className="db-scan">
          <ScanCard gmailConnected={gmailConnected} bare />
        </div>

        <Plots subs={subs} apparitions={apparitions} />
      </main>
    </div>
  );
}
