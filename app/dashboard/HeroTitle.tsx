"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

const LINE1 = "Your whole graveyard,";
const LINE2 = "on one screen.";
const FULL = `${LINE1} ${LINE2}`;

const letter: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(9px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: [0.2, 0.65, 0.3, 0.98] },
  },
};

function split(text: string, gradient: boolean, offset: number) {
  return text.split("").map((ch, i) =>
    ch === " " ? (
      <span key={offset + i} className="db-h1__sp" aria-hidden>
        &nbsp;
      </span>
    ) : (
      <motion.span
        key={offset + i}
        className={gradient ? "db-h1__ch db-h1__ch--grad" : "db-h1__ch"}
        variants={letter}
        aria-hidden
      >
        {ch}
      </motion.span>
    )
  );
}

/* Letter-by-letter reveal (fade up + blur→sharp, 30ms stagger).
   Line 1 white, line 2 purple gradient. Static under reduced-motion. */
export function HeroTitle() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <h1 className="db-h1">
        <span className="db-h1__ln">{LINE1}</span>
        <span className="db-h1__ln db-h1__ln--grad">{LINE2}</span>
      </h1>
    );
  }

  return (
    <motion.h1
      className="db-h1"
      aria-label={FULL}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.03, delayChildren: 0.15 } } }}
    >
      {split(LINE1, false, 0)}
      <span className="db-h1__br" aria-hidden />
      {split(LINE2, true, 100)}
    </motion.h1>
  );
}
