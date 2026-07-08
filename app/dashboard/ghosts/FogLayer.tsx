"use client";

/* Three slow radial-gradient fog banks at different depths/speeds.
   Ghosts between them get softly veiled. CSS transform drift only. */
export function FogLayer() {
  return (
    <div className="gh-fog" aria-hidden>
      <span className="gh-fog__bank gh-fog__bank--1" />
      <span className="gh-fog__bank gh-fog__bank--2" />
      <span className="gh-fog__bank gh-fog__bank--3" />
    </div>
  );
}
