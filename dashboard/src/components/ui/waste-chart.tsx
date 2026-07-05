import { motion } from "framer-motion";
import { useState } from "react";
import { YEARLY_WASTE } from "@/lib/data";
import { usd } from "@/lib/utils";

/** Single-series magnitude chart: one hue (violet), recessive grid,
    direct label on the final bar, per-bar hover tooltip. */
export function WasteChart() {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...YEARLY_WASTE.map((d) => d.value));

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-violet/20 bg-night-1/80 p-6"
      aria-label="Cumulative wasted spend by year"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.28em] text-muted">LIFETIME WASTE, EXHUMED</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-moon">Cumulative spend on unused spirits</h2>
        </div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted">'21 – '26</p>
      </div>

      <div className="mt-6 flex h-48 items-end gap-[6%] border-b border-stone/25 px-2">
        {YEARLY_WASTE.map((d, i) => (
          <div
            key={d.year}
            className="relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            {(hover === i || i === YEARLY_WASTE.length - 1) && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute -top-6 whitespace-nowrap rounded-md border border-violet/40 bg-night-2 px-2 py-0.5 font-mono text-[10px] text-moon"
              >
                {usd(d.value)}
              </motion.span>
            )}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 140, damping: 20 }}
              className="w-full rounded-t-[4px] bg-gradient-to-b from-violet to-fog shadow-[0_0_18px_rgba(122,108,240,0.25)]"
              style={{ opacity: hover === null || hover === i ? 1 : 0.55, transition: "opacity 0.2s ease" }}
            />
            <span className="absolute -bottom-6 font-mono text-[10px] tracking-[0.1em] text-stone">{d.year}</span>
          </div>
        ))}
      </div>
      <div className="h-7" />
    </motion.section>
  );
}
