"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { DEMO_CURRENT_MEMBER_ID, DEMO_MEMBERS } from "@/lib/demo";

/**
 * Shell mode: accepts any known first name from the demo list and signs in.
 * Real DB lookup lands when schema is wired.
 */
export async function signIn(formData: FormData): Promise<void> {
  const raw = String(formData.get("name") ?? "").trim().toLowerCase();
  if (!raw) throw new Error("Enter your first name.");

  const member = DEMO_MEMBERS.find((m) => m.first_name === raw);
  if (!member) throw new Error("That name isn't on the team.");

  // In shell mode we always sign the current user in as the "you" demo member
  // so balances match the mocked data.
  await createSession(DEMO_CURRENT_MEMBER_ID);
  redirect("/");
}
