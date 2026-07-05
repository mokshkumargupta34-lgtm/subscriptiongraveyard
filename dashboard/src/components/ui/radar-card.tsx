import { motion } from "framer-motion";

const BLIPS: Array<{ x: string; y: string; d: string; label: string }> = [
  { x: "44%", y: "24%", d: "0.3s", label: "streamflix $12.99" },
  { x: "26%", y: "48%", d: "1.6s", label: "gymrat+ $29" },
  { x: "58%", y: "62%", d: "2.4s", label: "cloudvault $9.99" },
  { x: "34%", y: "76%", d: "3.3s", label: "vpnghost $6.99" },
];

export function RadarCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.6 }}
      className="flex flex-col rounded-2xl border border-violet/20 bg-night-1/80 p-6"
      aria-label="Nightly scan radar"
    >
      <p className="font-mono text-[10px] tracking-[0.28em] text-muted">NIGHTLY SWEEP</p>
      <h2 className="mt-1 font-display text-lg font-semibold text-moon">Scanning for spirits</h2>

      <div
        className="relative mx-auto mt-5 aspect-square w-full max-w-56 overflow-hidden rounded-full border border-violet/25"
        style={{
          background:
            "radial-gradient(circle, transparent 0 24%, rgba(122,108,240,0.25) 24.5% 25%, transparent 25.5% 49%, rgba(122,108,240,0.25) 49.5% 50%, transparent 50.5% 74%, rgba(122,108,240,0.25) 74.5% 75%, transparent 75.5%), #0b0a28",
        }}
        aria-hidden
      >
        <div className="radar-sweep absolute inset-0 rounded-full" />
        {BLIPS.map((b) => (
          <span key={b.label} className="absolute" style={{ left: b.x, top: b.y }}>
            <i
              className="radar-blip block h-1.5 w-1.5 rounded-full bg-teal shadow-[0_0_10px_rgba(143,232,255,0.9)]"
              style={{ animationDelay: b.d }}
            />
            <em
              className="radar-blip absolute left-2.5 -top-1 whitespace-nowrap font-mono text-[8px] not-italic tracking-[0.06em] text-teal"
              style={{ animationDelay: b.d }}
            >
              {b.label}
            </em>
          </span>
        ))}
      </div>

      <p className="mt-5 text-center font-mono text-[10px] leading-relaxed tracking-[0.14em] text-muted">
        NEXT SWEEP IN <span className="text-teal">04:12:36</span>
        <br />
        4,000+ BILLERS MATCHED
      </p>
    </motion.section>
  );
}
