"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useBleed } from "./BleedContext";

/**
 * THE BLEED — a sticky HUD. Lifetime damage counts up (odometer) when it
 * scrolls into view; a live "draining" figure ticks upward and SLOWS as
 * the user buries subscriptions (activeMonthly falls via BleedContext).
 *
 * NOTE ON `accelerate`: a true per-second drip of a monthly bill is
 * invisibly small ($68/mo → $0.000026/s). We divide the monthly by
 * `accelerate` (default 60) so the drain is emotionally legible. The copy
 * is honest that it's sped up. Set accelerate to 2_592_000 for real time.
 */

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const P = {
  panel: "#12101F", line: "#211E33", bone: "#EAE5D9", muted: "#8A8397", faint: "#5A5470",
  money: "#37E17F", moneyDim: "#1E7A46",
};

export default function BleedCounter({
  lifetimeDamage,
  accelerate = 60,
}: {
  lifetimeDamage: number;
  accelerate?: number;
}) {
  const { activeMonthly, buriedAnnual } = useBleed();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const reduce = useReducedMotion();

  const [lifetime, setLifetime] = useState(reduce ? lifetimeDamage : 0);
  const [accum, setAccum] = useState(0);

  // rate kept in a ref so the ticker always sees the latest monthly
  const rate = useRef(activeMonthly / accelerate);
  useEffect(() => { rate.current = activeMonthly / accelerate; }, [activeMonthly, accelerate]);

  // odometer once in view
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, lifetimeDamage, {
      duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: setLifetime,
    });
    return () => controls.stop();
  }, [inView, lifetimeDamage, reduce]);

  // live drain ticker
  useEffect(() => {
    if (reduce) return;
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = (t - last) / 1000; last = t;
      setAccum((a) => a + rate.current * dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const alive = activeMonthly > 0.01;

  return (
    <div
      ref={ref}
      style={{ position: "sticky", top: 16, zIndex: 20, margin: "0 auto 40px", width: "min(680px, 92%)", background: `${P.panel}F2`, backdropFilter: "blur(8px)", border: `1px solid ${P.line}`, borderRadius: 6, padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 22px" }}
    >
      <div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.2em", color: P.faint }}>LIFETIME DAMAGE</div>
        <div style={{ fontFamily: "var(--font-display, serif)", fontSize: 30, color: P.money, textShadow: `0 0 24px ${P.money}55` }}>{money(lifetime)}</div>
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.2em", color: P.faint }}>STILL BLEEDING</div>
        <div style={{ fontFamily: "var(--font-display, serif)", fontSize: 30, color: alive ? P.bone : P.moneyDim }}>
          {money(activeMonthly)}<span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, color: P.muted }}> /mo</span>
        </div>
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${P.line}`, paddingTop: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, color: alive ? P.money : P.faint }}>
          <motion.span
            aria-hidden="true"
            animate={alive && !reduce ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: alive ? P.money : P.faint, marginRight: 8 }}
          />
          draining +{money(accum)} <span style={{ color: P.faint }}>· this session</span>
        </div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: P.money }}>saved {money(buriedAnnual)}/yr</div>
      </div>
    </div>
  );
}
