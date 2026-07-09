"use client";
import { Marquee } from "@/components/ui/marquee";

/* Atmospheric side columns that fill the empty space either side of the
   sign-in card on wide screens. Purely decorative — no real data, just
   gothic epitaphs drifting past. Hidden on narrow screens + reduced motion. */
const EPITAPHS = [
  "FREE TRIAL",
  "STILL BILLING",
  "FORGOTTEN · 2021",
  "AUTO-RENEWED",
  "NEVER CANCELLED",
  "BILLED FROM BEYOND",
  "THE TRIAL THAT LIVED",
  "REST IN PEACE",
];

function Stone({ text }: { text: string }) {
  return (
    <div className="lg-stone">
      <span className="lg-stone__rip">R.I.P</span>
      <span className="lg-stone__txt">{text}</span>
    </div>
  );
}

export function LoginDecor() {
  return (
    <>
      <div className="lg-side lg-side--left" aria-hidden="true">
        <Marquee vertical className="h-full [--duration:38s] [--gap:0.9rem]">
          {EPITAPHS.map((e) => (
            <Stone key={e} text={e} />
          ))}
        </Marquee>
      </div>
      <div className="lg-side lg-side--right" aria-hidden="true">
        <Marquee vertical reverse className="h-full [--duration:46s] [--gap:0.9rem]">
          {[...EPITAPHS].reverse().map((e) => (
            <Stone key={e} text={e} />
          ))}
        </Marquee>
      </div>
    </>
  );
}
