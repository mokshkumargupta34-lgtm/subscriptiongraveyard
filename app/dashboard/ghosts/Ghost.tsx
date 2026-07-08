"use client";

import { useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { GhostConfig } from "./randomPath";
import { useGhostMovement } from "./useGhostMovement";
import { Particle } from "./Particle";

interface Props {
  cfg: GhostConfig;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
}

/* A single autonomous, mouse-aware ghost.
   layers: outer (slow drift + fade) > repel (mouse) > bob/rotate/squash
   > body (idle controls) > SVG. */
export function Ghost({ cfg, pointer }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const { body, eyes, pupilX, pupilY, repelX, repelY, aware } = useGhostMovement(cfg, pointer, outerRef);

  const glow = useTransform(aware, [0, 1], [cfg.layer === "fg" ? 16 : 22, 34]);
  const dropShadow = useTransform(glow, (g) => `drop-shadow(0 0 ${g}px rgba(140,124,255,0.6))`);
  const awareScale = useTransform(aware, [0, 1], [1, 1.06]);

  return (
    <motion.div
      ref={outerRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: cfg.size,
        height: cfg.size * 1.16,
        marginLeft: -cfg.size / 2,
        marginTop: -cfg.size / 2,
        filter: cfg.blur ? `blur(${cfg.blur}px)` : undefined,
        willChange: "transform, opacity",
      }}
      initial={{ x: cfg.driftX[0], y: cfg.driftY[0], opacity: 0 }}
      animate={{
        x: cfg.driftX,
        y: cfg.driftY,
        opacity: [cfg.opacity * 0.55, cfg.opacity, cfg.opacity * 0.7, cfg.opacity],
      }}
      transition={{
        x: { duration: cfg.driftDur, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        y: { duration: cfg.driftDur * 1.13, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        opacity: { duration: cfg.fadeDur, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
      }}
    >
      <motion.div style={{ x: repelX, y: repelY, width: "100%", height: "100%" }}>
        <motion.div
          style={{ width: "100%", height: "100%", willChange: "transform" }}
          animate={{
            y: [0, -cfg.bobAmp, 0, cfg.bobAmp * 0.5, 0],
            rotate: [-cfg.rot, cfg.rot, -cfg.rot],
            scaleX: [1, 1.05, 0.97, 1],
            scaleY: [1, 0.95, 1.05, 1],
          }}
          transition={{
            y: { duration: cfg.bobDur, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: cfg.rotDur, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            scaleX: { duration: cfg.squashDur, repeat: Infinity, ease: "easeInOut" },
            scaleY: { duration: cfg.squashDur, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <motion.div
            animate={body}
            style={{ width: "100%", height: "100%", scale: awareScale, transformOrigin: "50% 60%" }}
          >
            <motion.div style={{ width: "100%", height: "100%", filter: dropShadow }}>
              <GhostSvg cfg={cfg} pupilX={pupilX} pupilY={pupilY} eyes={eyes} />
              {Array.from({ length: cfg.particles }, (_, i) => (
                <Particle key={i} index={i} />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function GhostSvg({
  cfg,
  pupilX,
  pupilY,
  eyes,
}: {
  cfg: GhostConfig;
  pupilX: MotionValue<number>;
  pupilY: MotionValue<number>;
  eyes: ReturnType<typeof useGhostMovement>["eyes"];
}) {
  return (
    <svg viewBox="0 0 100 116" width="100%" height="100%" style={{ transform: `scaleX(${cfg.flip})` }} aria-hidden>
      <defs>
        <radialGradient id={`gbody-${cfg.id}`} cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="62%" stopColor="#efecff" />
          <stop offset="100%" stopColor="#c9c1f6" />
        </radialGradient>
      </defs>

      {/* body */}
      <path
        d="M50 8 C27 8 18 30 18 54 L18 96 C18 105 26 106 30 99 C33 94 39 94 42 99 C45 104 51 104 54 99 C57 94 63 94 66 99 C69 104 75 104 78 99 C81 94 84 100 84 96 L84 54 C84 30 73 8 50 8 Z"
        fill={`url(#gbody-${cfg.id})`}
      />

      {/* cozy cheeks */}
      <circle cx="34" cy="60" r="6" fill="#c9a6ff" opacity="0.35" />
      <circle cx="66" cy="60" r="6" fill="#c9a6ff" opacity="0.35" />

      {/* eyes (blink via scaleY) */}
      <motion.g animate={eyes} style={{ transformOrigin: "50px 50px", transformBox: "fill-box" }}>
        <ellipse cx="39" cy="50" rx="6.4" ry="8.4" fill="#2a2452" />
        <ellipse cx="61" cy="50" rx="6.4" ry="8.4" fill="#2a2452" />
        {/* pupils track the cursor */}
        <motion.circle cx="39" cy="50" r="2.7" fill="#0b0920" style={{ x: pupilX, y: pupilY }} />
        <motion.circle cx="61" cy="50" r="2.7" fill="#0b0920" style={{ x: pupilX, y: pupilY }} />
        {/* eye-shine */}
        <circle cx="37" cy="47" r="1.5" fill="#fff" opacity="0.85" />
        <circle cx="59" cy="47" r="1.5" fill="#fff" opacity="0.85" />
      </motion.g>

      {/* smile */}
      <path d="M43 66 Q50 73 57 66" stroke="#2a2452" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
