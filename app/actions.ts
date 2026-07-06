"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { GMAIL_SCOPE, deleteAccount, revokeGoogle } from "@/lib/account";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/settings" });
}

/* Incremental consent: same provider + registered callback URL, wider
   scope. offline + consent guarantees a refresh token for the nightly
   scans; include_granted_scopes keeps the original identity grant. */
export async function connectGmail() {
  await signIn(
    "google",
    { redirectTo: "/settings?connected=1" },
    {
      scope: `openid email profile ${GMAIL_SCOPE}`,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    }
  );
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function disconnectGmailAction() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await revokeGoogle(session.user.id);
  redirect("/settings?disconnected=1");
}

export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await deleteAccount(session.user.id);
  await signOut({ redirectTo: "/?deleted=1" });
}
