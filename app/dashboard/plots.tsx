"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClock, ChartLine, Ghost, Rows3 } from "lucide-react";
import type { DashboardSub } from "@/lib/subs";
import {
  buryAction,
  dismissAction,
  dismissApparitionAction,
  mergeAction,
  resurrectAction,
  toggleAlertsAction,
} from "./actions";

interface Apparition {
  id: string;
  merchantGuess: string;
  amountCents: number | null;
  currency: string;
  chargedAt: string | null;
}

interface Extraction {
  year: number;
  months: number[];
  totalCents: number;
}

const money = (cents: number, currency = "USD") => {
  const sym = { USD: "$", EUR: "€", GBP: "£", INR: "₹" }[currency] ?? "$";
  return sym + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const moneyShort = (cents: number, currency = "USD") => {
  const sym = { USD: "$", EUR: "€", GBP: "£", INR: "₹" }[currency] ?? "$";
  return sym + Math.round(cents / 100).toLocaleString("en-US");
};
const dateShort = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const CADENCE_LABEL: Record<string, string> = { monthly: "/MO", yearly: "/YR", weekly: "/WK", unknown: "" };

export function Plots({
  subs,
  apparitions,
  extraction,
}: {
  subs: DashboardSub[];
  apparitions: Apparition[];
  extraction: Extraction;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [burstAt, setBurstAt] = useState<{ x: number; y: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const open = subs.find((s) => s.id === openId) ?? null;

  function bury(sub: DashboardSub, e?: React.MouseEvent) {
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight / 2;
    startTransition(async () => {
      await buryAction(sub.id);
      setBurstAt({ x, y });
      setTimeout(() => setBurstAt(null), 1200);
    });
  }

  return (
    <>
      <div className="db-duo">
        <section className="db-card" id="plots" aria-label="Your plots">
          <p className="db-card__head">
            <Rows3 aria-hidden /> The Plots
          </p>
          {subs.length === 0 ? (
            <div className="db-empty">
              <div className="db-orb" aria-hidden>
                <img src="/media/dash-orb.jpg" alt="" />
              </div>
              <p className="db-empty__title">No spirits yet</p>
              <p>Run your first séance above — connect Gmail in Settings if you haven&rsquo;t.</p>
            </div>
          ) : (
            <div className="db-graves">
              {subs.map((s) => (
                <div
                  key={s.id}
                  className={`db-grave${s.status === "buried" ? " db-grave--buried" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${s.displayName} details`}
                  onClick={() => setOpenId(s.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenId(s.id)}
                >
                  {s.status === "buried" && <span className="db-ribbon">AT REST</span>}
                  <p className="rip">R.I.P</p>
                  <h3>{s.displayName}</h3>
                  <p className="meta">
                    {s.firstSeenAt ? `SINCE ${new Date(s.firstSeenAt).getFullYear()}` : "SINCE ?"} ·{" "}
                    {moneyShort(s.amountCents, s.currency)}
                    {CADENCE_LABEL[s.cadence]}
                  </p>
                  <p className="damage">{moneyShort(s.lifetimeCents, s.currency)}</p>
                  <p className="damage-label">LIFETIME DAMAGE</p>
                  <p className="db-conf">CONFIDENCE {(s.confidence * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="db-card" aria-label="Extraction overview">
          <p className="db-card__head">
            <ChartLine aria-hidden /> Extraction Overview
            <span className="db-card__tag">This Year</span>
          </p>
          <p className="db-chart__total">
            <b>{money(extraction.totalCents)}</b>
            <span>Total Extracted · {extraction.year}</span>
          </p>
          <ExtractionChart months={extraction.months} />
        </section>
      </div>

      <section className="db-card" aria-label="Renewal calendar">
        <p className="db-card__head">
          <CalendarClock aria-hidden /> Renewal Calendar
        </p>
        <RenewalCalendar subs={subs} pending={pending} />
      </section>

      <section className="db-card db-appa-card" id="apparitions" aria-label="Apparitions">
        <div className="db-appa-card__head">
          <span className="db-ico db-ico--violet"><Ghost aria-hidden /></span>
          <div>
            <p className="db-card__title">Apparitions — Single Sightings Awaiting Review</p>
            <p className="db-card__desc">
              One-off receipts that don&rsquo;t recur (yet). They&rsquo;ll join a plot automatically if a second
              charge ever appears. Dismiss the ones that are just purchases.
            </p>
          </div>
        </div>
        {apparitions.length === 0 ? (
          <p className="db-card__desc" style={{ marginTop: "0.4rem" }}>Nothing sighted. The mist is quiet tonight.</p>
        ) : (
          <div className="db-appa">
            {apparitions.map((a) => (
              <span key={a.id} className="db-appa-chip">
                <i className="dot" aria-hidden />
                {a.merchantGuess} <span className="money">{a.amountCents ? money(a.amountCents, a.currency) : "?"}</span> ·{" "}
                {dateShort(a.chargedAt)}
                <button
                  type="button"
                  aria-label={`Dismiss ${a.merchantGuess}`}
                  onClick={() => startTransition(() => dismissApparitionAction(a.id))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {open && (
        <Drawer
          sub={open}
          all={subs}
          pending={pending}
          onClose={() => setOpenId(null)}
          onBury={(e) => bury(open, e)}
          onResurrect={() => startTransition(() => resurrectAction(open.id))}
          onDismiss={() => {
            setOpenId(null);
            startTransition(() => dismissAction(open.id));
          }}
          onMerge={(intoId) => {
            setOpenId(null);
            startTransition(() => mergeAction(open.id, intoId));
          }}
          onToggleAlerts={(v) => startTransition(() => toggleAlertsAction(open.id, v))}
        />
      )}

      {burstAt && <SparkleBurst x={burstAt.x} y={burstAt.y} />}
    </>
  );
}

function Drawer({
  sub,
  all,
  pending,
  onClose,
  onBury,
  onResurrect,
  onDismiss,
  onMerge,
  onToggleAlerts,
}: {
  sub: DashboardSub;
  all: DashboardSub[];
  pending: boolean;
  onClose: () => void;
  onBury: (e: React.MouseEvent) => void;
  onResurrect: () => void;
  onDismiss: () => void;
  onMerge: (intoId: string) => void;
  onToggleAlerts: (v: boolean) => void;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const others = all.filter((s) => s.id !== sub.id);

  return (
    <>
      <div className="db-overlay" onClick={onClose} />
      <aside className="db-drawer" role="dialog" aria-label={`${sub.displayName} details`}>
        <button className="db-close" onClick={onClose} aria-label="Close">✕</button>
        <p className="sub">THE PLOT OF</p>
        <h3>{sub.displayName}</h3>
        <p className="sub">
          {sub.cadence.toUpperCase()} · CONFIDENCE {(sub.confidence * 100).toFixed(0)}% ·{" "}
          {sub.status === "buried" ? "AT REST" : "STILL FEEDING"}
        </p>

        <div className="db-rows">
          <div className="db-row"><span>Amount</span><span className="money">{money(sub.amountCents, sub.currency)}{CADENCE_LABEL[sub.cadence] && ` ${CADENCE_LABEL[sub.cadence]}`}</span></div>
          <div className="db-row"><span>Lifetime damage</span><span className="money">{money(sub.lifetimeCents, sub.currency)}</span></div>
          <div className="db-row"><span>First seen</span><span>{dateShort(sub.firstSeenAt)}</span></div>
          <div className="db-row"><span>Last charge</span><span>{dateShort(sub.lastChargeAt)}</span></div>
          <div className="db-row"><span>Renewal estimate</span><span>{sub.status === "buried" ? "— (buried)" : dateShort(sub.nextRenewalEst)}</span></div>
        </div>

        <p className="sub">RECEIPT HISTORY ({sub.receipts.length})</p>
        <div className="db-rows db-receipts">
          {sub.receipts.map((r) => (
            <div className="db-row" key={r.id}>
              <span>{dateShort(r.chargedAt)}</span>
              <span className="money">{r.amountCents ? money(r.amountCents, r.currency ?? sub.currency) : "?"}</span>
            </div>
          ))}
        </div>

        <label className="db-toggle" style={{ marginTop: "0.8rem" }}>
          <input
            type="checkbox"
            checked={sub.alertsEnabled}
            onChange={(e) => onToggleAlerts(e.target.checked)}
          />
          EMAIL ME 3 DAYS BEFORE RENEWAL
        </label>

        {showGuide && (
          <div className="db-guide">
            <p className="sub" style={{ color: "#f0c96e" }}>
              BURIAL RITE {sub.guide ? `· DIFFICULTY: ${sub.guide.difficulty.toUpperCase()}` : ""}
            </p>
            <ol>
              {(sub.guide?.steps ?? [
                { step: 1, text: `Sign in to your ${sub.displayName} account` },
                { step: 2, text: "Open account or billing settings" },
                { step: 3, text: "Find Subscription / Membership and choose Cancel" },
                { step: 4, text: "Save or screenshot the confirmation" },
              ]).map((st) => (
                <li key={st.step}>{st.text}</li>
              ))}
            </ol>
            {sub.guide?.url && (
              <p style={{ marginTop: "0.6rem" }}>
                <a href={sub.guide.url} target="_blank" rel="noopener noreferrer">Open the cancellation page ↗</a>
              </p>
            )}
            {sub.guide?.phone && <p className="sub" style={{ marginTop: "0.4rem" }}>PHONE: {sub.guide.phone}</p>}
            <div className="db-actions">
              <button className="db-btn db-btn--gold" disabled={pending} onClick={(e) => onBury(e)}>
                I CANCELLED IT — BURY ⚰
              </button>
              <button className="db-btn db-btn--ghost" onClick={() => setShowGuide(false)}>NOT YET</button>
            </div>
          </div>
        )}

        <div className="db-actions">
          {sub.status === "active" && !showGuide && (
            <button className="db-btn db-btn--gold" onClick={() => setShowGuide(true)}>
              BURY IT → GUIDE
            </button>
          )}
          {sub.status === "buried" && (
            <button className="db-btn db-btn--ghost" disabled={pending} onClick={onResurrect}>
              RESURRECT
            </button>
          )}
          <button className="db-btn db-btn--danger" disabled={pending} onClick={onDismiss}>
            NOT A SUBSCRIPTION
          </button>
        </div>

        {others.length > 0 && (
          <div className="db-actions" style={{ alignItems: "center" }}>
            <select
              className="db-select"
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              aria-label="Merge into"
            >
              <option value="">Merge into…</option>
              {others.map((o) => (
                <option key={o.id} value={o.id}>{o.displayName}</option>
              ))}
            </select>
            <button
              className="db-btn db-btn--ghost"
              disabled={!mergeTarget || pending}
              onClick={() => mergeTarget && onMerge(mergeTarget)}
            >
              MERGE
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function RenewalCalendar({ subs, pending }: { subs: DashboardSub[]; pending: boolean }) {
  const [, startTransition] = useTransition();
  void pending;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const { cells, renewDays, upcoming } = useMemo(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();
    const cells: Array<number | null> = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    const renewDays = new Set<number>();
    const upcoming: Array<{ sub: DashboardSub; date: Date }> = [];
    for (const s of subs) {
      if (s.status !== "active" || !s.nextRenewalEst) continue;
      const d = new Date(s.nextRenewalEst);
      if (d.getFullYear() === year && d.getMonth() === month) renewDays.add(d.getDate());
      const in30 = d.getTime() - now.getTime() < 30 * 86_400_000 && d.getTime() > now.getTime() - 86_400_000;
      if (in30) upcoming.push({ sub: s, date: d });
    }
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    return { cells, renewDays, upcoming };
  }, [subs, year, month, now]);

  if (subs.length === 0) {
    return <p className="db-card__desc">Plots first — renewals appear here after your first séance finds spirits.</p>;
  }

  return (
    <>
      <p className="db-card__desc" style={{ marginBottom: "0.9rem" }}>
        {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
      <div className="db-cal" role="img" aria-label="Calendar of upcoming renewals this month">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span className="dow" key={i}>{d}</span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={i} />
          ) : (
            <span key={i} className={`day${renewDays.has(d) ? " renew" : ""}${d === now.getDate() ? " today" : ""}`}>
              {d}
              {renewDays.has(d) && <i />}
            </span>
          )
        )}
      </div>
      <div className="db-renew-list">
        {upcoming.length === 0 && (
          <p style={{ color: "#a3a0d6", fontSize: "0.92rem" }}>No renewals estimated in the next 30 days.</p>
        )}
        {upcoming.map(({ sub, date }) => (
          <div className="db-renew-item" key={sub.id}>
            <span>
              <span style={{ color: "#e9e7ff" }}>{sub.displayName}</span>{" "}
              <span className="db-mono" style={{ color: "#f0c96e", fontSize: "0.7rem" }}>
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </span>
            <span className="db-mono" style={{ color: "#bfe9cd", fontSize: "0.8rem" }}>
              {money(sub.amountCents, sub.currency)}
            </span>
            <label className="db-toggle">
              <input
                type="checkbox"
                checked={sub.alertsEnabled}
                onChange={(e) => startTransition(() => toggleAlertsAction(sub.id, e.target.checked))}
              />
              ALERT
            </label>
          </div>
        ))}
      </div>
    </>
  );
}

/* Single-series monthly line: violet stroke, dot markers, recessive
   grid, mono axis labels; native <title> tooltips per point. */
function ExtractionChart({ months }: { months: number[] }) {
  const W = 520;
  const H = 180;
  const PAD = { l: 44, r: 12, t: 12, b: 26 };
  const max = Math.max(100, ...months.map((c) => c / 100));
  const nice = Math.ceil(max / 50) * 50;
  const x = (i: number) => PAD.l + (i / 11) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / nice) * (H - PAD.t - PAD.b);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pts = months.map((c, i) => `${x(i).toFixed(1)},${y(c / 100).toFixed(1)}`).join(" ");

  return (
    <svg
      className="db-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Monthly extraction: ${months.map((c, i) => `${MONTHS[i]} $${(c / 100).toFixed(0)}`).join(", ")}`}
    >
      {[0, nice / 2, nice].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="grid" />
          <text x={PAD.l - 8} y={y(v) + 3} textAnchor="end" className="axis">
            ${v}
          </text>
        </g>
      ))}
      {MONTHS.map((m, i) => (
        <text key={m} x={x(i)} y={H - 8} textAnchor="middle" className="axis">
          {m}
        </text>
      ))}
      <polyline points={pts} className="line" />
      {months.map((c, i) => (
        <circle key={i} cx={x(i)} cy={y(c / 100)} r="3.4" className="dotpt">
          <title>{`${MONTHS[i]}: $${(c / 100).toFixed(2)}`}</title>
        </circle>
      ))}
    </svg>
  );
}

function SparkleBurst({ x, y }: { x: number; y: number }) {
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 60 + (i % 3) * 30;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 20,
      delay: (i % 5) * 0.04,
    };
  });
  return (
    <div className="db-burst" style={{ left: x, top: y }} aria-hidden>
      {sparks.map((s, i) => (
        <i
          key={i}
          style={{ "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, animationDelay: `${s.delay}s` } as React.CSSProperties}
        >
          ✦
        </i>
      ))}
    </div>
  );
}
