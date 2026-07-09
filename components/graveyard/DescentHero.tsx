"use client";
import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from "framer-motion";

/**
 * THE DESCENT — a pinned hero. Scrolling sinks the viewer through soil
 * strata; a fixed depth meter reads FEET and YEAR so depth == billing age.
 * Swap the palette/soil for your real assets; the mechanics are the point.
 */

const SOIL = {
  bg: "#0A0917", bone: "#EAE5D9", money: "#37E17F", glow: "#A855F7",
  purpleDim: "#4C2E8A", dirt1: "#4A3423", dirt2: "#33230F", dirt3: "#241708", bedrock: "#160F22",
};

const ACTS: [string, string, number, number][] = [
  ["ACT I · THE DESCENT", "Something down there is still charging your card.", 0.0, 0.15],
  ["ACT II · THE STRATA", "The deeper you dig, the older the charges.", 0.17, 0.42],
  ["ACT III · THE DEEP", "Some have been billing since you had a flip phone.", 0.46, 0.7],
  ["ACT IV · BEDROCK", "Nothing down here was ever cancelled.", 0.74, 1.0],
];

/** Subscribes to a MotionValue and renders it as formatted text. */
function Readout({ mv, format }: { mv: MotionValue<number>; format: (n: number) => string }) {
  const [txt, setTxt] = useState(() => format(mv.get()));
  useMotionValueEvent(mv, "change", (v) => setTxt(format(v)));
  return <>{txt}</>;
}

function Coffin({ label, since, top, left }: { label: string; since: string; top: string; left: string }) {
  return (
    <div style={{ position: "absolute", top, left, width: 132, padding: "10px 12px", background: "#0000004D", border: `1px solid ${SOIL.dirt1}`, borderRadius: 3, transform: "rotate(-1.5deg)" }}>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.12em", color: SOIL.bone, opacity: 0.75 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, color: SOIL.money, opacity: 0.6, marginTop: 3 }}>billing since {since}</div>
    </div>
  );
}

export default function DescentHero() {
  const wrap = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });

  const worldY = useTransform(scrollYProgress, [0, 1], ["0vh", "-220vh"]);
  const coreScaleY = scrollYProgress;
  const depthMv = useTransform(scrollYProgress, [0, 1], [0, 9]);
  const yearMv = useTransform(scrollYProgress, [0, 1], [2025, 2015]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  return (
    <section ref={wrap} style={{ height: "320vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: SOIL.bg }}>
        {/* descending world */}
        <motion.div style={{ position: "absolute", inset: 0, height: "320vh", y: worldY, willChange: "transform" }}>
          <div style={{ height: "100vh", position: "relative", background: `radial-gradient(120% 80% at 50% 42%, ${SOIL.purpleDim}66 0%, ${SOIL.bg} 60%)` }}>
            <div style={{ position: "absolute", bottom: 0, width: "100%", height: 90, background: `linear-gradient(${SOIL.bg}00, ${SOIL.dirt3})` }} />
            {[12, 26, 40, 58, 72, 86].map((l, i) => (
              <div key={i} style={{ position: "absolute", bottom: 40, left: `${l}%`, width: 34 + (i % 3) * 10, height: 46 + (i % 2) * 22, background: "#000000B3", borderRadius: "8px 8px 0 0" }} />
            ))}
          </div>
          <div style={{ height: "50vh", position: "relative", background: `linear-gradient(${SOIL.dirt1}, ${SOIL.dirt2})` }}>
            <Coffin label="NEWS DAILY+" since="2022" top="18%" left="16%" />
            <Coffin label="PHOTO CLOUD" since="2021" top="52%" left="60%" />
          </div>
          <div style={{ height: "55vh", position: "relative", background: `linear-gradient(${SOIL.dirt2}, ${SOIL.dirt3})` }}>
            <Coffin label="VPN SHIELD" since="2019" top="30%" left="22%" />
            <Coffin label="MUSIC PRO" since="2018" top="66%" left="58%" />
          </div>
          <div style={{ height: "60vh", position: "relative", background: `linear-gradient(${SOIL.dirt3}, ${SOIL.bedrock})` }}>
            <Coffin label="GAME PASS" since="2016" top="40%" left="30%" />
          </div>
          <div style={{ height: "55vh", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(80% 60% at 50% 50%, ${SOIL.purpleDim}55, ${SOIL.bedrock})` }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: SOIL.money }}>BEDROCK · 2015</div>
              <div style={{ fontFamily: "var(--font-display, serif)", fontSize: "clamp(24px,4vw,40px)", color: SOIL.bone, marginTop: 12 }}>The oldest grave.</div>
            </div>
          </div>
        </motion.div>

        {/* fixed depth meter */}
        <div style={{ position: "absolute", top: "50%", left: 26, transform: "translateY(-50%)", display: "flex", gap: 14, alignItems: "center", zIndex: 4 }}>
          <div style={{ width: 3, height: 200, background: "#211E33", borderRadius: 2, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
            <motion.div style={{ width: "100%", originY: 1, scaleY: coreScaleY, height: "100%", background: `linear-gradient(${SOIL.glow}, ${SOIL.money})` }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono, monospace)" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#5A5470" }}>DEPTH</div>
            <div style={{ fontSize: 22, color: SOIL.bone }}>
              <Readout mv={depthMv} format={(n) => n.toFixed(1)} />
              <span style={{ fontSize: 12, color: "#8A8397" }}> ft</span>
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#5A5470", marginTop: 10 }}>YEAR</div>
            <div style={{ fontSize: 22, color: SOIL.money }}>
              <Readout mv={yearMv} format={(n) => String(Math.round(n))} />
            </div>
          </div>
        </div>

        {/* crossfading act captions */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "12vh", pointerEvents: "none", zIndex: 4 }}>
          {ACTS.map(([eyebrow, line, a, b], i) => (
            <Caption key={i} progress={scrollYProgress} eyebrow={eyebrow} line={line} a={a} b={b} />
          ))}
        </div>

        {/* scroll hint — fades out as the descent begins */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: hintOpacity, position: "absolute", bottom: 30, width: "100%", textAlign: "center", zIndex: 4, pointerEvents: "none", fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "#5A5470" }}
        >
          SCROLL TO DESCEND ↓
        </motion.div>
      </div>
    </section>
  );
}

function Caption({ progress, eyebrow, line, a, b }: { progress: MotionValue<number>; eyebrow: string; line: string; a: number; b: number }) {
  const mid = (a + b) / 2;
  const opacity = useTransform(progress, [a, mid, b], [0, 1, 0]);
  const y = useTransform(progress, [a, mid, b], [16, 0, 16]);
  return (
    <motion.div style={{ position: "absolute", textAlign: "center", padding: "0 24px", opacity, y }}>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: SOIL.glow, marginBottom: 14 }}>{eyebrow}</div>
      <div style={{ fontFamily: "var(--font-display, serif)", fontWeight: 700, fontSize: "clamp(26px,5vw,52px)", color: SOIL.bone, lineHeight: 1.15, maxWidth: 720 }}>{line}</div>
    </motion.div>
  );
}
