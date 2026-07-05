import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { RENEWALS } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Renewals() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.6 }}
      className="rounded-2xl border border-violet/20 bg-night-1/80 p-6"
      aria-label="Upcoming renewals"
    >
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-stone" />
        <p className="font-mono text-[10px] tracking-[0.28em] text-muted">KNOW BEFORE YOU'RE CHARGED</p>
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {RENEWALS.map((r, i) => {
          const urgent = r.inDays <= 3;
          const frac = 1 - r.inDays / 30;
          return (
            <motion.li
              key={r.name}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.09, duration: 0.4 }}
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-ink">{r.name}</span>
                <span className="text-money">${r.amount.toFixed(2)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-dark/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${frac * 100}%` }}
                    transition={{ delay: 0.9 + i * 0.09, duration: 0.9, ease: "easeOut" }}
                    className={cn("h-full rounded-full", urgent ? "bg-gold" : "bg-violet")}
                  />
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.12em]",
                    urgent ? "pulse-gold border-gold/50 text-gold" : "border-stone/30 text-stone"
                  )}
                >
                  {r.inDays}d
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
