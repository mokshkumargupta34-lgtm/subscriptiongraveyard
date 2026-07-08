"use client";

import { motion } from "framer-motion";
import { rand } from "./randomPath";

/* A tiny drifting sparkle that orbits a ghost. Transform/opacity only. */
export function Particle({ index }: { index: number }) {
  const angle = rand(0, Math.PI * 2);
  const radius = rand(26, 46);
  const ox = Math.cos(angle) * radius;
  const oy = Math.sin(angle) * radius;
  const dur = rand(3.5, 6.5);

  return (
    <motion.span
      aria-hidden
      style={{
        position: "absolute",
        left: `calc(50% + ${ox}px)`,
        top: `calc(45% + ${oy}px)`,
        width: rand(2.5, 4.5),
        height: rand(2.5, 4.5),
        borderRadius: "50%",
        background: "radial-gradient(circle, #e9e7ff, rgba(122,108,240,0))",
        boxShadow: "0 0 6px rgba(155,140,255,0.9)",
        pointerEvents: "none",
      }}
      animate={{
        x: [0, rand(-8, 8), 0],
        y: [0, rand(-12, -4), 0],
        opacity: [0, 0.9, 0],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration: dur,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.6 + rand(0, 1.5),
      }}
    />
  );
}
