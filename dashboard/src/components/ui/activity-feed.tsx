import { motion } from "framer-motion";
import { Bell, Ghost, Radar, Shovel } from "lucide-react";
import { ACTIVITY } from "@/lib/data";

const ICONS = { shovel: Shovel, scan: Radar, ghost: Ghost, bell: Bell } as const;

export function ActivityFeed() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75, duration: 0.6 }}
      className="rounded-2xl border border-violet/20 bg-night-1/80 p-6"
      aria-label="Recent activity"
    >
      <p className="font-mono text-[10px] tracking-[0.28em] text-muted">FRESH FROM THE CRYPT</p>

      <ul className="mt-4 flex flex-col gap-4">
        {ACTIVITY.map((a, i) => {
          const Icon = ICONS[a.icon as keyof typeof ICONS];
          return (
            <motion.li
              key={a.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
              className="flex items-start gap-3"
            >
              <motion.span
                whileHover={{ rotate: -12, scale: 1.1 }}
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-violet/25 bg-night-2/60 text-stone"
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.span>
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{a.text}</p>
                <p className="font-mono text-[10px] tracking-[0.1em] text-muted">
                  <span className="text-money">{a.detail}</span> · {a.when}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
