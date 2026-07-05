import { motion, useReducedMotion } from "framer-motion";
import { Ghost } from "lucide-react";

const SPRITES = [
  { left: "8%", size: 22, delay: 0, dur: 17 },
  { left: "28%", size: 16, delay: 5, dur: 21 },
  { left: "55%", size: 26, delay: 2, dur: 19 },
  { left: "76%", size: 14, delay: 9, dur: 23 },
  { left: "91%", size: 18, delay: 12, dur: 18 },
];

/** Ambient ghosts drifting up the page, behind all content. */
export function Ghosts() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {SPRITES.map((s, i) => (
        <motion.span
          key={i}
          className="absolute text-stone/25"
          style={{ left: s.left }}
          initial={{ y: "110vh" }}
          animate={{ y: "-10vh", x: [0, 18, -14, 10, 0] }}
          transition={{
            y: { duration: s.dur, delay: s.delay, repeat: Infinity, ease: "linear" },
            x: { duration: s.dur / 2, delay: s.delay, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <Ghost style={{ width: s.size, height: s.size }} />
        </motion.span>
      ))}
    </div>
  );
}
