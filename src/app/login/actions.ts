"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { getMemberByFirstName } from "@/lib/queries";

/**
 * Sign in. First name identifies the cofounder; team passcode is a shared
 * secret that gates drive-by access. If TEAM_PASSCODE env var isn't set,
 * the passcode check is skipped (dev / local mode).
 */
export async function signIn(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim().toLowerCase();
  const passcode = String(formData.get("passcode") ?? "").trim();

  if (!name) throw new Error("Enter your first name.");

  const expected = process.env.TEAM_PASSCODE;
  if (expected && passcode !== expected) {
    throw new Error("Wrong team passcode.");
  }

  const member = await getMemberByFirstName(name);
  if (!member) throw new Error("That name isn't on the team.");

  await createSession(member.id);
  redirect("/");
}
