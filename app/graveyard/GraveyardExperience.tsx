"use client";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import DescentHero from "@/components/graveyard/DescentHero";
import BleedCounter from "@/components/graveyard/BleedCounter";
import Tombstone, { Plot } from "@/components/graveyard/Tombstone";
import { BleedProvider, useBleed } from "@/components/graveyard/BleedContext";

/**
 * The public, playable graveyard — the three signature moments composed
 * into one funnel: THE DESCENT (feel the depth) → THE BURIAL + THE BLEED
 * (feel the relief) → a real CTA to sign in and bury your own.
 *
 * Sample plots (a visitor isn't authenticated here). The dashboard wires
 * the same mechanics to real Gmail-scanned subscriptions.
 */
const PLOTS: Plot[] = [
  { name: "Streamflix Premium", span: "2019 – 2025", monthly: 22.99, lifetime: 1655 },
  { name: "Cloud Backup Pro", span: "2017 – 2025", monthly: 11.99, lifetime: 1151 },
  { name: "Zen Meditation", span: "2021 – 2025", monthly: 14.99, lifetime: 719 },
  { name: "PowerLift+ App", span: "2020 – 2025", monthly: 9.99, lifetime: 599 },
];
const START_MONTHLY = PLOTS.reduce((s, p) => s + p.monthly, 0);
const LIFETIME_DAMAGE = 3532;

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ---- atmosphere: fixed fog banks, film grain, lantern cursor ---- */
function Atmosphere({ lantern }: { lantern: { x: number; y: number } }) {
  return (
    <>
      <div className="gy-atmos" aria-hidden="true">
        <svg className="gy-grain">
          <filter id="gy-grain-f">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#gy-grain-f)" />
        </svg>
        <div className="gy-fog gy-fog--1" />
        <div className="gy-fog gy-fog--2" />
      </div>
      <div className="gy-lantern-wrap" aria-hidden="true">
        <div className="gy-lantern" style={{ left: lantern.x, top: lantern.y }} />
      </div>
    </>
  );
}

/* ---- finale: reads live bleed state, funnels to sign-in ---- */
function Finale() {
  const { activeMonthly, buriedAnnual, buriedCount } = useBleed();
  const done = activeMonthly <= 0.01 && buriedCount > 0;

  return (
    <div className="gy-finale">
      {done ? (
        <>
          <div className="gy-finale__hush">The bleeding has stopped.</div>
          <p className="gy-finale__note">
            {money(buriedAnnual)}/yr back in your pocket. That was four. Your inbox is hiding more.
          </p>
        </>
      ) : (
        <>
          <div className="gy-finale__eyebrow">ACT VI · THE RECKONING</div>
          <h2 className="gy-finale__title">These four were fiction. Yours are real.</h2>
          <p className="gy-finale__note">
            Connect Gmail read-only and we exhume every recurring charge hiding in your inbox —
            with lifetime spend and one-click burial guides.
          </p>
        </>
      )}
      <a className="gy-finale__cta" href="/login">
        <span>Exhume my inbox</span>
      </a>
      <p className="gy-finale__fine">READ-ONLY GMAIL SCOPE · REVOKE ANY TIME · NO EMAIL LEAVES YOUR ACCOUNT</p>
    </div>
  );
}

export function GraveyardExperience() {
  const reduce = useReducedMotion();
  const [lantern, setLantern] = useState({ x: -999, y: -999 });
  const raf = useRef(0);

  const onMove = useCallback((e: MouseEvent) => {
    const x = e.clientX, y = e.clientY;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setLantern({ x, y }));
  }, []);

  return (
    <div className="gy" onMouseMove={reduce ? undefined : onMove}>
      <Atmosphere lantern={lantern} />

      {/* chrome */}
      <header className="gy-chrome">
        <a className="gy-back" href="/">← BACK TO THE GRAVEYARD</a>
        <a className="gy-chrome__cta" href="/login">Exhume my inbox</a>
      </header>

      {/* 1. THE DESCENT */}
      <DescentHero />

      {/* 2 + 3. THE BURIAL, watched by THE BLEED */}
      <BleedProvider initialMonthly={START_MONTHLY}>
        <section className="gy-burial" aria-label="Bury the subscriptions">
          <BleedCounter lifetimeDamage={LIFETIME_DAMAGE} />

          <div className="gy-burial__head">
            <div className="gy-burial__eyebrow">ACT V · THE BURIAL</div>
            <h2 className="gy-burial__title">Lay them to rest. One click each.</h2>
            <p className="gy-burial__sub">Watch the bleed slow with every burial.</p>
          </div>

          <div className="gy-plots">
            {PLOTS.map((p) => (
              <Tombstone key={p.name} plot={p} />
            ))}
          </div>

          <Finale />
        </section>
      </BleedProvider>
    </div>
  );
}
