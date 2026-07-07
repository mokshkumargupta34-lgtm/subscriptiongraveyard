"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

type ScanState =
  | { phase: "idle" }
  | { phase: "running"; messagesSeen: number; receiptsFound: number }
  | { phase: "done"; receiptsFound: number; subscriptionsFound: number; apparitions: number }
  | { phase: "error"; message: string; reconsent?: boolean };

export function SeanceCard({ gmailConnected, hasSubs }: { gmailConnected: boolean; hasSubs: boolean }) {
  const [state, setState] = useState<ScanState>({ phase: "idle" });
  const sourceRef = useRef<EventSource | null>(null);
  const router = useRouter();

  function start() {
    sourceRef.current?.close();
    setState({ phase: "running", messagesSeen: 0, receiptsFound: 0 });
    const es = new EventSource("/api/app/scan/stream");
    sourceRef.current = es;
    es.onmessage = (e) => {
      const p = JSON.parse(e.data);
      if (p.phase === "error") {
        setState({ phase: "error", message: p.message, reconsent: p.reconsent });
        es.close();
      } else if (p.phase === "done") {
        setState({
          phase: "done",
          receiptsFound: p.receiptsFound ?? 0,
          subscriptionsFound: p.subscriptionsFound ?? 0,
          apparitions: p.apparitions ?? 0,
        });
        es.close();
        router.refresh();
      } else if (typeof p.messagesSeen === "number") {
        setState({ phase: "running", messagesSeen: p.messagesSeen, receiptsFound: p.receiptsFound ?? 0 });
      }
    };
    es.onerror = () => {
      es.close();
      setState((s) =>
        s.phase === "running" ? { phase: "error", message: "stream interrupted — try again in a minute" } : s
      );
    };
  }

  const title =
    state.phase === "done"
      ? "Séance Complete"
      : state.phase === "running"
        ? "The Séance Is Underway"
        : hasSubs
          ? "Summon Another Séance"
          : "Summon Your First Séance";

  return (
    <section className="db-seance" id="seance" aria-label="Run a scan">
      <div className="db-seance__art" aria-hidden="true">
        <svg viewBox="0 0 120 90">
          <circle cx="92" cy="20" r="12" fill="#e9e7ff" opacity="0.85" />
          <circle cx="88" cy="17" r="12" fill="#131028" />
          <path d="M28 78V42c0-13 8-22 20-22s20 9 20 22v36" fill="#2a2452" stroke="#4a3d8f" strokeWidth="2" />
          <path d="M38 44h20M48 34v22" stroke="#8d86c9" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="52" cy="80" rx="40" ry="6" fill="#1c1a4a" />
          <path d="M8 80c8-4 20-4 28 0M76 80c8-4 20-4 28 0" stroke="#241f4d" strokeWidth="3" fill="none" />
        </svg>
      </div>

      <div className="db-seance__copy">
        <h2>{title}</h2>
        {state.phase === "running" && (
          <p className="db-mono db-seance__live" role="status">
            SCANNING INBOX… <b>{state.messagesSeen.toLocaleString()}</b> MESSAGES ·{" "}
            <b>{state.receiptsFound.toLocaleString()}</b> RECEIPTS
          </p>
        )}
        {state.phase === "done" && (
          <p className="db-mono db-seance__live" role="status">
            <b>{state.receiptsFound.toLocaleString()}</b> NEW RECEIPTS · <b>{state.subscriptionsFound}</b> SPIRITS ·{" "}
            <b>{state.apparitions}</b> APPARITIONS
          </p>
        )}
        {state.phase === "error" && (
          <p className="db-mono db-seance__err" role="alert">
            {state.reconsent ? "GOOGLE ACCESS EXPIRED — RECONNECT GMAIL IN SETTINGS" : `SCAN FAILED: ${state.message}`}
          </p>
        )}
        {(state.phase === "idle" || state.phase === "running") && (
          <p className="db-seance__desc">
            Re-scans are incremental — already-parsed receipts are skipped. A nightly sweep runs automatically.
          </p>
        )}
      </div>

      <button
        className="db-seance__btn"
        type="button"
        onClick={start}
        disabled={!gmailConnected || state.phase === "running"}
        title={gmailConnected ? undefined : "Connect Gmail in Settings first"}
      >
        <Sparkles aria-hidden />
        {state.phase === "running" ? "Scanning…" : state.phase === "done" ? "Run Again" : hasSubs ? "Run Séance" : "Run First Séance"}
      </button>
    </section>
  );
}
