import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/app/actions";
import { AetherBackground } from "./aether";
import { WaitlistForm } from "./waitlist-form";
import { LoginDecor } from "./login-decor";
import { BorderBeam } from "@/components/ui/border-beam";
import "./login.css";

export const metadata: Metadata = {
  title: "Sign in — Subscription Graveyard",
  description: "Sign in with Google (read-only Gmail access) or join the waitlist.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/settings");

  return (
    <div className="lg-body">
      <a className="lg-back" href="/">&larr; BACK TO THE GRAVEYARD</a>

      <AetherBackground />
      <div className="lg-tint" aria-hidden="true" />
      <div className="lg-glow lg-glow--top" aria-hidden="true" />
      <div className="lg-glow lg-glow--corner" aria-hidden="true" />
      <LoginDecor />

      <main className="lg-wrap">
        <div className="lg-card">
          <BorderBeam size={240} duration={14} colorFrom="#f0c96e" colorTo="#7a6cf0" className="opacity-70" />
          <BorderBeam size={240} duration={14} delay={7} colorFrom="#7a6cf0" colorTo="#37e17f" className="opacity-60" />
          <p className="lg-rip">R.I.P · FREE TRIALS</p>
          <h1 className="lg-title">Enter the graveyard</h1>
          <p className="lg-sub">Sign in to exhume your inbox. The dead are only observed.</p>

          <form action={signInWithGoogle}>
            <button className="lg-google" type="submit">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </form>
          <p className="lg-note">Early access — sign-in works for invited test users while Google verifies the app.</p>

          <div className="lg-divider" aria-hidden="true">not invited yet?</div>
          <WaitlistForm />

          <ul className="lg-vows">
            <li>READ-ONLY SCOPE</li>
            <li>REVOKE ANY TIME</li>
            <li>NO EMAIL LEAVES YOUR ACCOUNT</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
