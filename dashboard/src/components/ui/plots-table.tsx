import { AnimatePresence, motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { useState } from "react";
import { SUBSCRIPTIONS, type Subscription } from "@/lib/data";
import { cn, usd } from "@/lib/utils";

export function PlotsTable() {
  const [subs, setSubs] = useState<Subscription[]>(SUBSCRIPTIONS);
  const [risingGhost, setRisingGhost] = useState<string | null>(null);

  const bury = (id: string) => {
    setSubs((s) => s.map((x) => (x.id === id ? { ...x, status: x.status === "buried" ? "active" : "buried" } : x)));
    setRisingGhost(id);
    setTimeout(() => setRisingGhost((g) => (g === id ? null : g)), 1300);
  };

  const total = subs.reduce((a, s) => a + s.lifetime, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.6 }}
      className="overflow-hidden rounded-2xl border border-teal/25 bg-night-1/80 shadow-[0_0_50px_rgba(143,232,255,0.06)]"
      aria-label="Your subscriptions"
    >
      <div className="flex items-center gap-2 border-b border-teal/15 bg-night-0/50 px-5 py-3">
        <i className="h-2 w-2 rounded-full bg-stone-dark" />
        <i className="h-2 w-2 rounded-full bg-stone-dark" />
        <i className="h-2 w-2 rounded-full bg-stone-dark" />
        <span className="ml-3 font-mono text-[10px] tracking-[0.18em] text-muted">graveyard.app · your plots</span>
      </div>

      <table className="w-full font-mono text-[13px]">
        <thead>
          <tr className="text-left">
            {["SPIRIT", "SINCE", "MONTHLY", "LIFETIME", "STATUS", ""].map((h) => (
              <th key={h} className="border-b border-violet/20 px-5 py-3 text-[9px] font-normal tracking-[0.26em] text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subs.map((s, i) => (
            <motion.tr
              key={s.id}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: s.status === "buried" ? 0.55 : 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
              className="group relative border-b border-violet/10 transition-colors duration-200 hover:bg-violet/[0.06]"
            >
              <td className="px-5 py-3.5">
                <span className="relative inline-flex items-center gap-2 text-ink">
                  {s.name}
                  <AnimatePresence>
                    {risingGhost === s.id && (
                      <motion.span
                        initial={{ opacity: 0, y: 6, scale: 0.6 }}
                        animate={{ opacity: [0, 1, 0], y: -26, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute -right-7 text-moon"
                        aria-hidden
                      >
                        <Ghost className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <p className="mt-0.5 text-[10px] tracking-[0.12em] text-muted">{s.lastUsed}</p>
              </td>
              <td className="px-5 py-3.5 text-stone">{s.since}</td>
              <td className="px-5 py-3.5 text-money">{s.monthly ? `$${s.monthly.toFixed(2)}` : "—"}</td>
              <td className="px-5 py-3.5 text-money">{usd(s.lifetime)}</td>
              <td className="px-5 py-3.5">
                <motion.span
                  key={s.status}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "inline-block rounded-full border px-2.5 py-0.5 text-[9px] tracking-[0.2em]",
                    s.status === "active" ? "border-teal/40 text-teal" : "border-gold/40 text-gold"
                  )}
                >
                  {s.status === "active" ? "ACTIVE" : "BURIED"}
                </motion.span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => bury(s.id)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-[9px] tracking-[0.16em] transition-colors duration-200",
                    s.status === "active"
                      ? "border-gold/60 text-gold hover:bg-gold hover:text-night-0"
                      : "border-stone/40 text-stone hover:border-violet/50 hover:text-ink"
                  )}
                >
                  {s.status === "active" ? "BURY IT" : "RESURRECT"}
                </motion.button>
              </td>
            </motion.tr>
          ))}
          <tr>
            <td className="px-5 py-4 text-[11px] tracking-[0.2em] text-moon">TOTAL EXTRACTION</td>
            <td colSpan={2} />
            <td className="px-5 py-4 text-base font-bold text-money">{usd(total)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
    </motion.section>
  );
}
