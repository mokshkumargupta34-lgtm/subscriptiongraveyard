/* On-theme 404 — mirrors public/404.html for app-router routes. */
import { Particles } from "@/components/ui/particles";
import { BorderBeam } from "@/components/ui/border-beam";

export default function NotFound() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        background:
          "radial-gradient(60% 50% at 50% 10%, rgba(122,108,240,.12), transparent), #07071c",
        color: "#cfd0ef",
        fontFamily: '"Spectral", Georgia, serif',
        textAlign: "center",
        padding: 24,
      }}
    >
      <Particles className="absolute inset-0" quantity={120} color="#8d86c9" ease={70} staticity={40} />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          maxWidth: 420,
          padding: "4rem 2.5rem 3rem",
          background: "linear-gradient(170deg, #3b3272, #211c45)",
          border: "1px solid rgba(141,134,201,.35)",
          borderRadius: "130px 130px 12px 12px",
          boxShadow: "0 20px 60px rgba(4,4,16,.6)",
        }}
      >
        <BorderBeam size={200} duration={12} colorFrom="#f0c96e" colorTo="#7a6cf0" className="opacity-70" />
        <p style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: ".7rem", letterSpacing: ".5em", color: "#a3a0d6", marginBottom: ".8rem" }}>
          R.I.P · 404
        </p>
        <h1 style={{ fontFamily: '"Cinzel", serif', fontSize: "3rem", letterSpacing: ".1em", color: "#e9e7ff", margin: 0 }}>
          This plot is empty.
        </h1>
        <p style={{ fontStyle: "italic", marginTop: ".8rem", color: "#a3a0d6" }}>
          Whatever you were looking for was either buried, exhumed, or never subscribed to at all.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: "2rem",
            padding: ".8rem 1.8rem",
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: ".72rem",
            letterSpacing: ".18em",
            color: "#f0c96e",
            border: "1px solid rgba(240,201,110,.65)",
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          ← BACK TO THE GRAVEYARD
        </a>
      </div>
    </main>
  );
}
