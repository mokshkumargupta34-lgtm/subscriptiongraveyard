import { motion } from "framer-motion";
import { Radar } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-mono text-[10px] tracking-[0.4em] text-gold">THE RECKONING</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-wide text-moon">
          Your whole graveyard, on one screen
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="border-beam relative rounded-full border border-teal/25 bg-night-1 px-4 py-2"
      >
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-teal">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="inline-flex"
          >
            <Radar className="h-3.5 w-3.5" />
          </motion.span>
          SCANNING INBOX · <span className="text-money">2,847</span> RECEIPTS · <span className="text-money">14</span> SPIRITS
        </span>
      </motion.div>
    </header>
  );
}
