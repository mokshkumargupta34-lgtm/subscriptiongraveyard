import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** rAF count-up with ease-out cubic; renders the final value instantly
    under prefers-reduced-motion. */
export function useCountUp(target: number, duration = 1600, delay = 0) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) { setValue(target); return; }
    let raf = 0;
    let start = 0;
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        setValue(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, duration, delay, reduced]);

  return value;
}
