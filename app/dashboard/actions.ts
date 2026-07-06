"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  dismissApparition,
  dismissSub,
  mergeSubs,
  setStatus,
  toggleAlerts,
} from "@/lib/subs";

async function requireUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  return session.user.id;
}

export async function buryAction(subId: string) {
  await setStatus(await requireUser(), subId, "buried");
  revalidatePath("/dashboard");
}

export async function resurrectAction(subId: string) {
  await setStatus(await requireUser(), subId, "active");
  revalidatePath("/dashboard");
}

export async function dismissAction(subId: string) {
  await dismissSub(await requireUser(), subId);
  revalidatePath("/dashboard");
}

export async function mergeAction(fromId: string, intoId: string) {
  await mergeSubs(await requireUser(), fromId, intoId);
  revalidatePath("/dashboard");
}

export async function toggleAlertsAction(subId: string, enabled: boolean) {
  await toggleAlerts(await requireUser(), subId, enabled);
  revalidatePath("/dashboard");
}

export async function dismissApparitionAction(receiptId: string) {
  await dismissApparition(await requireUser(), receiptId);
  revalidatePath("/dashboard");
}
