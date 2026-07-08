/* Deterministic-per-mount randomness for the floating ghost system.
   Every ghost gets a unique path, speed, size, opacity and phase so no
   two ever move alike. */

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export type Layer = "bg" | "mid" | "fg";

export interface GhostConfig {
  id: number;
  layer: Layer;
  size: number;
  opacity: number;
  blur: number;
  /* absolute-px waypoints across the viewport (loops back to start) */
  driftX: number[];
  driftY: number[];
  driftDur: number;
  bobAmp: number;
  bobDur: number;
  rot: number;
  rotDur: number;
  squashDur: number;
  fadeDur: number;
  particles: number;
  flip: number; /* 1 or -1 — mirror some ghosts */
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeGhosts(count: number, vw: number, vh: number): GhostConfig[] {
  const nBg = Math.max(2, Math.round(count * 0.28));
  const nFg = Math.max(2, Math.round(count * 0.3));
  const layers: Layer[] = [];
  for (let i = 0; i < count; i++) {
    layers.push(i < nBg ? "bg" : i < count - nFg ? "mid" : "fg");
  }
  shuffle(layers);

  return layers.map((layer, id) => {
    const waypoints = randInt(4, 6);
    const driftX: number[] = [];
    const driftY: number[] = [];
    for (let k = 0; k < waypoints; k++) {
      driftX.push(rand(0.04, 0.95) * vw);
      driftY.push(rand(0.06, 0.9) * vh);
    }
    /* close the loop so the mirror-repeat is seamless */
    driftX.push(driftX[0]);
    driftY.push(driftY[0]);

    const size =
      layer === "bg" ? rand(210, 320) : layer === "mid" ? rand(120, 172) : rand(66, 102);
    const opacity =
      layer === "bg" ? rand(0.09, 0.15) : layer === "mid" ? rand(0.17, 0.24) : rand(0.3, 0.38);
    const blur = layer === "bg" ? rand(5, 9) : layer === "mid" ? rand(1, 2.5) : 0;
    const driftDur =
      layer === "bg" ? rand(115, 155) : layer === "mid" ? rand(85, 120) : rand(55, 88);

    return {
      id,
      layer,
      size,
      opacity,
      blur,
      driftX,
      driftY,
      driftDur,
      bobAmp: rand(6, 14),
      bobDur: rand(3.4, 6.2),
      rot: rand(2.5, 4),
      rotDur: rand(5, 9),
      squashDur: rand(2.6, 4.4),
      fadeDur: rand(7, 13),
      particles: layer === "fg" ? randInt(2, 3) : 0,
      flip: Math.random() < 0.5 ? -1 : 1,
    };
  });
}
