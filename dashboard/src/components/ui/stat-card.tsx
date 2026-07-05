import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface StatCardProps {
  index: number;
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: string;
  trendTone?: "good" | "bad";
  spark?: number[];
  glints?: boolean;
}

const GLINTS: Array<[string, string, string]> = [
  ["-4%", "10%", "0s"],
  ["70%", "-12%", "0.9s"],
  ["96%", "60%", "1.7s"],
];

export function StatCard({ index, icon: Icon, label, value, prefix = "", suffix = "", trend, trendTone = "good", spark, glints }: StatCardProps) {
  const n = useCountUp(value, 1600, 300 + index * 140);
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const sparkPath = spark
    ? spark
        .map((v, i) => {
          const x = (i / (spark.length - 1)) * 100;
          const y = 28 - (v / Math.max(...spark)) * 24;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    : null;

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
      className="glow-ring relative overflow-hidden rounded-2xl border border-violet/20 bg-night-1/80 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.28em] text-muted">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-violet/25 bg-night-2/60 text-stone">
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className={cn("relative mt-3 font-mono text-3xl font-bold tabular-nums", prefix === "$" ? "text-money" : "text-moon")}>
        {prefix}
        {Math.round(n).toLocaleString("en-US")}
        {suffix}
        {glints &&
          GLINTS.map(([x, y, d], i) => (
            <span
              key={i}
              aria-hidden
              className="glint absolute text-sm text-gold"
              style={{ left: x, top: y, animationDelay: d }}
            >
              ✦
            </span>
          ))}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        {trend && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em]",
              trendTone === "good" ? "border-money/30 text-money" : "border-gold/40 text-gold"
            )}
          >
            {trend}
          </span>
        )}
        {sparkPath && (
          <svg viewBox="0 0 100 30" className="h-7 w-24 overflow-visible" aria-hidden>
            <motion.path
              d={sparkPath}
              fill="none"
              stroke="#7a6cf0"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5 + index * 0.12, duration: 1.1, ease: "easeInOut" }}
            />
          </svg>
        )}
      </div>
    </motion.div>
  );
}
