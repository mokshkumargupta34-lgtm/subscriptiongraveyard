"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useBleed } from "./BleedContext";

/**
 * THE BURIAL — clicking BURY IT tilts the stone, fills the grave with
 * rising dirt, strikes out the damage, and (via BleedContext) slows the
 * live bleed counter. This is the product's dopamine moment.
 */

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const P = {
  panel: "#12101F", line: "#211E33", bone: "#EAE5D9", muted: "#8A8397", faint: "#5A5470",
  money: "#37E17F", moneyDim: "#1E7A46", purple: "#8B5CF6", purpleDim: "#4C2E8A",
  dirt1: "#4A3423", dirt3: "#241708", bg: "#0A0917",
};

export type Plot = { name: string; span: string; monthly: number; lifetime: number };

export default function Tombstone({ plot }: { plot: Plot }) {
  const { bury } = useBleed();
  const [buried, setBuried] = useState(false);
  const reduce = useReducedMotion();

  const doBury = () => {
    if (buried) return;
    setBuried(true);
    bury(plot.monthly);
  };

  const clods = Array.from({ length: 7 }, (_, i) => i);

  return (
    <motion.div
      animate={buried ? { y: 6, rotate: -1.2 } : { y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      style={{ position: "relative", overflow: "hidden", borderRadius: "80px 80px 8px 8px", background: P.panel, border: `1px solid ${P.line}`, padding: "34px 22px 26px", textAlign: "center" }}
    >
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, letterSpacing: "0.3em", color: P.faint }}>R&nbsp;&nbsp;I&nbsp;&nbsp;P</div>
      <div style={{ fontFamily: "var(--font-display, serif)", fontWeight: 700, fontSize: 19, color: P.bone, margin: "10px 0 4px", textShadow: "0 1px 0 rgba(255,255,255,.06), 0 -1px 0 rgba(0,0,0,.5)" }}>{plot.name}</div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: P.muted, marginBottom: 18 }}>{plot.span}</div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", color: P.faint }}>LIFETIME DAMAGE</div>
      <motion.div
        animate={buried ? { color: P.moneyDim, opacity: 0.6 } : { color: P.money, opacity: 1 }}
        style={{ fontFamily: "var(--font-display, serif)", fontSize: 30, textDecoration: buried ? "line-through" : "none", textShadow: buried ? "none" : `0 0 20px ${P.money}44` }}
      >
        {money(plot.lifetime)}
      </motion.div>

      <button
        onClick={doBury}
        disabled={buried}
        style={{ marginTop: 20, width: "100%", fontFamily: "var(--font-mono, monospace)", fontSize: 12, letterSpacing: "0.2em", padding: "12px 0", borderRadius: 3, cursor: buried ? "default" : "pointer", border: `1px solid ${buried ? P.line : P.purpleDim}`, background: buried ? "transparent" : `${P.purple}1A`, color: buried ? P.faint : P.bone, transition: "background .3s, color .3s" }}
        onMouseEnter={(e) => { if (!buried) { e.currentTarget.style.background = P.purple; e.currentTarget.style.color = P.bg; } }}
        onMouseLeave={(e) => { if (!buried) { e.currentTarget.style.background = `${P.purple}1A`; e.currentTarget.style.color = P.bone; } }}
      >
        {buried ? "† BURIED †" : "BURY IT"}
      </button>

      {/* rising dirt */}
      <motion.div
        aria-hidden="true"
        initial={{ height: "0%" }}
        animate={{ height: buried ? "118%" : "0%" }}
        transition={reduce ? { duration: 0 } : { duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: `linear-gradient(${P.dirt1}, ${P.dirt3})`, zIndex: 5 }}
      >
        <svg viewBox="0 0 200 20" preserveAspectRatio="none" style={{ position: "absolute", top: -18, left: 0, width: "100%", height: 20 }}>
          <path d="M0,20 Q20,4 40,12 T80,10 T120,13 T160,7 T200,12 L200,20 Z" fill={P.dirt1} />
        </svg>
        {buried && <div style={{ position: "absolute", top: 14, width: "100%", textAlign: "center", fontFamily: "var(--font-display, serif)", fontSize: 13, letterSpacing: "0.2em", color: P.dirt1, filter: "brightness(2.2)" }}>† at rest †</div>}
      </motion.div>

      {/* flung clods */}
      <AnimatePresence>
        {buried && !reduce && clods.map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            animate={{ opacity: 0, x: (i - 3) * 16, y: -90, rotate: 180 }}
            transition={{ duration: 0.9, delay: i * 0.03, ease: "easeOut" }}
            style={{ position: "absolute", bottom: 40, left: `${20 + i * 9}%`, width: 8 + (i % 3) * 3, height: 8 + (i % 3) * 3, borderRadius: "40%", background: P.dirt1, zIndex: 6 }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
