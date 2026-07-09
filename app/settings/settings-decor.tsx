"use client";
import { Particles } from "@/components/ui/particles";

/* Faint particle field behind the settings column, filling the empty
   space either side of the 680px content. Non-interactive. */
export function SettingsDecor() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.6 }}
    >
      <Particles className="absolute inset-0" quantity={110} color="#8d86c9" ease={80} staticity={50} />
    </div>
  );
}
