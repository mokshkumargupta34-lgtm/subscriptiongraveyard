"use client";

import { useEffect, useRef } from "react";
import {
  useAnimationControls,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { pick, rand, randInt, type GhostConfig } from "./randomPath";

const IDLE_ACTIONS = ["boo", "spin", "shy", "glow", "look"] as const;
type Idle = (typeof IDLE_ACTIONS)[number];

/* Owns a single ghost's living behaviour: blink, idle actions, pupil
   look-around, and mouse awareness (eyes track the cursor + gentle
   repel that eases back after ~4s). All driven by motion values /
   controls so React never re-renders per frame. */
export function useGhostMovement(
  cfg: GhostConfig,
  pointer: { x: MotionValue<number>; y: MotionValue<number> },
  outerRef: React.RefObject<HTMLDivElement | null>
) {
  const body = useAnimationControls();
  const eyes = useAnimationControls();

  const pupilX = useMotionValue(0);
  const pupilY = useMotionValue(0);
  const repelX = useMotionValue(0);
  const repelY = useMotionValue(0);
  const aware = useMotionValue(0); /* 0..1 → glow/scale when noticed */

  const awareUntil = useRef(0);

  /* blink loop */
  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      if (!alive) return;
      eyes.start({ scaleY: [1, 0.12, 1], transition: { duration: 0.16, ease: "easeInOut" } });
      /* occasional double-blink */
      if (Math.random() < 0.25) {
        setTimeout(() => alive && eyes.start({ scaleY: [1, 0.12, 1], transition: { duration: 0.16 } }), 240);
      }
      t = setTimeout(loop, rand(2600, 6800));
    };
    t = setTimeout(loop, rand(1200, 5000));
    return () => { alive = false; clearTimeout(t); };
  }, [eyes]);

  /* idle-action loop */
  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const run = (a: Idle) => {
      switch (a) {
        case "boo":
          return body.start({ y: [0, -14, 0], transition: { duration: 0.7, ease: "easeOut" } });
        case "spin":
          return body.start({ rotate: [0, 360], transition: { duration: 1.6, ease: "easeInOut" } });
        case "shy":
          return body.start({ opacity: [1, 0.25, 1], transition: { duration: 1.4, ease: "easeInOut" } });
        case "glow":
          return body.start({ scale: [1, 1.12, 1], transition: { duration: 1.3, ease: "easeInOut" } });
        case "look": {
          const dir = Math.random() < 0.5 ? -1 : 1;
          pupilX.set(0);
          return Promise.resolve()
            .then(() => animateMV(pupilX, 1.7 * dir, 0.5))
            .then(() => new Promise((r) => setTimeout(r, 700)))
            .then(() => animateMV(pupilX, 0, 0.5));
        }
      }
    };
    const loop = () => {
      if (!alive) return;
      if (performance.now() > awareUntil.current) run(pick(IDLE_ACTIONS));
      t = setTimeout(loop, rand(5000, 12000));
    };
    t = setTimeout(loop, rand(3000, 9000));
    return () => { alive = false; clearTimeout(t); };
  }, [body, pupilX]);

  /* mouse awareness — recomputed only when the pointer moves */
  const react = () => {
    const el = outerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = pointer.x.get() - cx;
    const dy = pointer.y.get() - cy;
    const dist = Math.hypot(dx, dy);
    const RADIUS = 130 + r.width * 0.25;

    if (dist < RADIUS && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      /* eyes look toward the cursor */
      pupilX.set(Math.max(-2.4, Math.min(2.4, nx * 2.4)));
      pupilY.set(Math.max(-2, Math.min(2, ny * 2)));
      /* gentle repel away from it */
      const push = (1 - dist / RADIUS) * 22;
      repelX.set(-nx * push);
      repelY.set(-ny * push);
      aware.set(1);
      awareUntil.current = performance.now() + 4000;
    } else if (performance.now() > awareUntil.current) {
      /* ease back to calm */
      repelX.set(repelX.get() * 0.9);
      repelY.set(repelY.get() * 0.9);
      aware.set(aware.get() * 0.92);
    }
  };
  /* coalesce x+y change into one rect read per frame */
  const raf = useRef(0);
  const schedule = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      react();
    });
  };
  useMotionValueEvent(pointer.x, "change", schedule);
  useMotionValueEvent(pointer.y, "change", schedule);
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return { body, eyes, pupilX, pupilY, repelX, repelY, aware };
}

/* tiny spring-ish tween on a motion value without pulling in controls */
function animateMV(mv: MotionValue<number>, to: number, dur: number) {
  const from = mv.get();
  const start = performance.now();
  return new Promise<void>((resolve) => {
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / (dur * 1000));
      const e = 1 - Math.pow(1 - t, 3);
      mv.set(from + (to - from) * e);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export const idleSeed = () => randInt(0, 9999);
