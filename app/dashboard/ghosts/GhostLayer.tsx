"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Ghost } from "./Ghost";
import { FogLayer } from "./FogLayer";
import { makeGhosts, rand, randInt } from "./randomPath";
import "./ghosts.css";

interface Flyer {
  key: number;
  y: number;
  dir: 1 | -1;
  dur: number;
}

/* The living graveyard layer. Fixed behind all cards (pointer-events
   none). Spawns layered ghosts, fog, and two ambient "events": a ghost
   that flies across the screen leaving sparkles, and one that peeks
   from behind the sidebar. */
export function GhostLayer() {
  const reduced = useReducedMotion();
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [peek, setPeek] = useState(false);

  const pointerX = useMotionValue(-9999);
  const pointerY = useMotionValue(-9999);
  const pointer = useMemo(() => ({ x: pointerX, y: pointerY }), [pointerX, pointerY]);

  /* measure viewport (client only → no hydration mismatch) */
  useEffect(() => {
    const measure = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      pointerX.set(e.clientX);
      pointerY.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, pointerX, pointerY]);

  const count = reduced || !dims ? 0 : dims.w < 900 ? 5 : 10;
  const ghosts = useMemo(
    () => (dims && count ? makeGhosts(count, dims.w, dims.h) : []),
    [dims, count]
  );

  /* ambient event: fly across the screen every 30–60s */
  useEffect(() => {
    if (reduced || !dims) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setFlyer({ key: Date.now(), y: rand(0.12, 0.8) * dims.h, dir: Math.random() < 0.5 ? 1 : -1, dur: rand(7, 10) });
        schedule();
      }, rand(30000, 60000));
    };
    schedule();
    return () => { alive = false; clearTimeout(t); };
  }, [reduced, dims]);

  /* ambient event: peek from behind the sidebar every ~40s */
  useEffect(() => {
    if (reduced || !dims || dims.w < 900) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setPeek(true);
        setTimeout(() => alive && setPeek(false), 3600);
        schedule();
      }, rand(38000, 62000));
    };
    schedule();
    return () => { alive = false; clearTimeout(t); };
  }, [reduced, dims]);

  if (reduced || !dims || !count) return null;

  return (
    <div className="gh-layer" aria-hidden>
      <FogLayer />

      {ghosts.map((cfg) => (
        <Ghost key={cfg.id} cfg={cfg} pointer={pointer} />
      ))}

      {/* peeker */}
      <AnimatePresence>
        {peek && (
          <motion.div
            className="gh-peeker"
            initial={{ x: -70, opacity: 0, rotate: -12 }}
            animate={{ x: 8, opacity: 0.9, rotate: -4 }}
            exit={{ x: -70, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ top: rand(0.22, 0.6) * dims.h }}
          >
            <MiniGhost size={56} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* cross-screen flyer + sparkle trail */}
      <AnimatePresence>
        {flyer && (
          <motion.div
            key={flyer.key}
            className="gh-flyer"
            style={{ top: flyer.y }}
            initial={{ x: flyer.dir === 1 ? -120 : dims.w + 120, opacity: 0, scaleX: flyer.dir }}
            animate={{ x: flyer.dir === 1 ? dims.w + 120 : -120, opacity: [0, 0.85, 0.85, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: flyer.dur, ease: "easeInOut" }}
            onAnimationComplete={() => setFlyer(null)}
          >
            <MiniGhost size={64} />
            {Array.from({ length: 7 }, (_, i) => (
              <motion.span
                key={i}
                className="gh-spark"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.3], x: -20 * flyer.dir - i * 14 * flyer.dir, y: rand(-10, 10) }}
                transition={{ duration: rand(0.9, 1.6), repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* simple static ghost for the ambient events (no eye-tracking needed) */
function MiniGhost({ size }: { size: number }) {
  const id = useMemo(() => randInt(1000, 9999), []);
  return (
    <motion.svg
      viewBox="0 0 100 116"
      width={size}
      height={size * 1.16}
      aria-hidden
      animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "drop-shadow(0 0 20px rgba(140,124,255,0.7))" }}
    >
      <defs>
        <radialGradient id={`mini-${id}`} cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c9c1f6" />
        </radialGradient>
      </defs>
      <path
        d="M50 8 C27 8 18 30 18 54 L18 96 C18 105 26 106 30 99 C33 94 39 94 42 99 C45 104 51 104 54 99 C57 94 63 94 66 99 C69 104 75 104 78 99 C81 94 84 100 84 96 L84 54 C84 30 73 8 50 8 Z"
        fill={`url(#mini-${id})`}
      />
      <ellipse cx="39" cy="50" rx="6" ry="8" fill="#2a2452" />
      <ellipse cx="61" cy="50" rx="6" ry="8" fill="#2a2452" />
      <path d="M43 66 Q50 73 57 66" stroke="#2a2452" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </motion.svg>
  );
}
