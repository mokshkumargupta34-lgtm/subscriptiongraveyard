import { motion } from "framer-motion";
import { Ghost, LayoutGrid, Shovel, CalendarClock, Settings, Skull } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: Ghost, label: "Spirits" },
  { icon: Shovel, label: "Burials" },
  { icon: CalendarClock, label: "Renewals" },
  { icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const [active, setActive] = useState(0);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-violet/15 bg-night-1/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 px-6 py-6"
      >
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 text-moon"
        >
          <Skull className="h-4 w-4" />
        </motion.span>
        <div>
          <p className="font-display text-sm font-bold tracking-[0.12em] text-moon">GRAVEYARD</p>
          <p className="font-mono text-[9px] tracking-[0.3em] text-muted">YOUR PLOTS</p>
        </div>
      </motion.div>

      <nav className="mt-4 flex flex-col gap-1 px-3" aria-label="Dashboard">
        {NAV.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
            whileHover={{ x: 4 }}
            onClick={() => setActive(i)}
            className={cn(
              "relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body text-sm transition-colors duration-200",
              active === i ? "text-moon" : "text-muted hover:text-ink"
            )}
          >
            {active === i && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-lg border border-violet/40 bg-violet/15 shadow-[0_0_20px_rgba(122,108,240,0.25)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <item.icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-auto px-6 py-6 font-mono text-[9px] leading-relaxed tracking-[0.2em] text-muted/70"
      >
        EST. WHEREVER
        <br />
        FREE TRIALS GO TO DIE
      </motion.div>
    </aside>
  );
}
