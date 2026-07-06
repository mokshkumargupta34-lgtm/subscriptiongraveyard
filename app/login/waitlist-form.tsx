"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (new FormData(form).get("email") as string)?.trim();
    if (!email) return;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* best effort */
    }
    setDone(true);
  }

  if (done) return <p className="lg-success" role="status">You&rsquo;re on the list. We&rsquo;ll summon you.</p>;

  return (
    <form className="lg-field" onSubmit={submit}>
      <label htmlFor="wl-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Email address
      </label>
      <input id="wl-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
      <button type="submit">JOIN WAITLIST</button>
    </form>
  );
}
