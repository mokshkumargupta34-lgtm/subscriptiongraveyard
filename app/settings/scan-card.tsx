"use client";

import { useRef, useState } from "react";

type ScanState =
  | { phase: "idle" }
  | { phase: "running"; messagesSeen: number; receiptsFound: number }
  | { phase: "done"; messagesSeen: number; receiptsFound: number; subscriptionsFound: number; apparitions: number }
  | { phase: "error"; message: string; reconsent?: boolean };

export function ScanCard({ gmailConnected }: { gmailConnected: boolean }) {
  const [state, setState] = useState<ScanState>({ phase: "idle" });
  const sourceRef = useRef<EventSource | null>(null);

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
          messagesSeen: p.messagesSeen ?? 0,
          receiptsFound: p.receiptsFound ?? 0,
          subscriptionsFound: p.subscriptionsFound ?? 0,
          apparitions: p.apparitions ?? 0,
        });
        es.close();
      } else if (typeof p.messagesSeen === "number") {
        setState({ phase: "running", messagesSeen: p.messagesSeen, receiptsFound: p.receiptsFound ?? 0 });
      }
    };
    es.onerror = () => {
      es.close();
      setState((s) => (s.phase === "running" ? { phase: "error", message: "stream interrupted — check the scan again in a minute" } : s));
    };
  }

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, Menlo, Consolas, monospace",
    letterSpacing: "0.14em",
    fontSize: "0.72rem",
  };

  return (
    <section className="st-card">
      <h2>The séance</h2>
      <p>
        Scan your inbox for receipt emails. Only headers and preview snippets are read;
        parsed fields are all we keep.
      </p>

      {state.phase === "running" && (
        <p style={{ ...mono, color: "#8fe8ff" }} role="status">
          SCANNING INBOX… <span style={{ color: "#bfe9cd" }}>{state.messagesSeen.toLocaleString()}</span> MESSAGES ·{" "}
          <span style={{ color: "#bfe9cd" }}>{state.receiptsFound.toLocaleString()}</span> RECEIPTS
        </p>
      )}
      {state.phase === "done" && (
        <p style={{ ...mono, color: "#bfe9cd" }} role="status">
          SÉANCE COMPLETE · {state.receiptsFound.toLocaleString()} RECEIPTS ·{" "}
          {state.subscriptionsFound} SPIRITS FOUND · {state.apparitions} APPARITIONS AWAITING REVIEW
        </p>
      )}
      {state.phase === "error" && (
        <p style={{ ...mono, color: "#ff8a8a" }} role="alert">
          {state.reconsent ? "GOOGLE ACCESS EXPIRED — RECONNECT GMAIL ABOVE AND TRY AGAIN" : `SCAN FAILED: ${state.message}`}
        </p>
      )}

      <div className="st-row" style={{ marginTop: "0.9rem" }}>
        <button
          className="st-btn st-btn--gold"
          type="button"
          onClick={start}
          disabled={!gmailConnected || state.phase === "running"}
          style={!gmailConnected || state.phase === "running" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
        >
          {state.phase === "running" ? "SCANNING…" : state.phase === "done" ? "RUN AGAIN" : "RUN THE FIRST SÉANCE →"}
        </button>
        {!gmailConnected && <span className="st-badge st-badge--off">CONNECT GMAIL FIRST</span>}
      </div>
      <p className="st-fine">RE-SCANS ARE INCREMENTAL — ALREADY-PARSED RECEIPTS ARE SKIPPED. A NIGHTLY SWEEP RUNS AUTOMATICALLY.</p>
    </section>
  );
}
