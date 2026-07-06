import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectGmail, deleteAccountAction, disconnectGmailAction, signOutAction } from "@/app/actions";
import { getGoogleAccount, hasGmailScope } from "@/lib/account";
import { ConfirmSubmit } from "./delete-button";
import { ScanCard } from "./scan-card";
import "./settings.css";

export const metadata: Metadata = { title: "Settings — Subscription Graveyard" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; disconnected?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const acct = await getGoogleAccount(session.user.id);
  const gmailConnected = hasGmailScope(acct?.scope);

  return (
    <div className="st-body">
      <div className="st-top">
        <a href="/">SUBSCRIPTION GRAVEYARD</a>
        <form action={signOutAction}>
          <button className="st-btn st-btn--ghost" type="submit">SIGN OUT</button>
        </form>
      </div>

      <main className="st-main">
        <p className="st-kicker">THE CRYPT KEEPER · SETTINGS</p>
        <h1 className="st-h1">{session.user.name ?? session.user.email}</h1>

        {params.connected && <p className="st-flash" role="status">Gmail connected. The first séance can begin.</p>}
        {params.disconnected && <p className="st-flash" role="status">Gmail disconnected — our access is revoked at Google.</p>}

        <section className="st-card">
          <h2>Gmail connection</h2>
          <p>
            Read-only <code>gmail.readonly</code> scope. We parse receipt emails into subscription
            records — raw email content is never stored.
          </p>
          <div className="st-row">
            <span className={gmailConnected ? "st-badge st-badge--on" : "st-badge st-badge--off"}>
              {gmailConnected ? "CONNECTED · READ-ONLY" : "NOT CONNECTED"}
            </span>
            {gmailConnected ? (
              <form action={disconnectGmailAction}>
                <ConfirmSubmit
                  className="st-btn st-btn--ghost"
                  label="DISCONNECT & REVOKE"
                  message="Disconnect Gmail? We revoke our token with Google immediately and scanning stops."
                />
              </form>
            ) : (
              <form action={connectGmail}>
                <button className="st-btn st-btn--gold" type="submit">CONNECT GMAIL →</button>
              </form>
            )}
          </div>
          <p className="st-fine">
            YOU CAN ALSO REVOKE ACCESS ANY TIME AT MYACCOUNT.GOOGLE.COM/PERMISSIONS
          </p>
        </section>

        <ScanCard gmailConnected={gmailConnected} />

        <section className="st-card">
          <h2>Account</h2>
          <p>
            Signed in as {session.user.email}. Deleting your account revokes Google access and
            permanently removes every row we hold about you — subscriptions, parsed receipts,
            scan history, tokens.
          </p>
          <form action={deleteAccountAction}>
            <ConfirmSubmit
              className="st-btn st-btn--danger"
              label="DELETE ACCOUNT & ALL DATA"
              message="Permanently delete your account and all data? This cannot be undone."
            />
          </form>
        </section>
      </main>
    </div>
  );
}
