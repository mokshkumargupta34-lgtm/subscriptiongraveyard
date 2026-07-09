"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

/* Animated count-up for the dashboard metric numbers. `text-current`
   overrides NumberTicker's default black/white so it inherits the
   card's near-white metric color. */
export function StatNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  return (
    <>
      {prefix}
      <NumberTicker value={value} className="text-current" />
    </>
  );
}
