import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "./supabase/server";
import type { Member } from "./types";

const SESSION_COOKIE = "foundersplit_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * Encode a member id into a signed cookie value. The signing is intentionally
 * simple — this app is for 5 trusted cofounders, not a public product. If you
 * ever open it up, switch to `iron-session` or a real JWT signer.
 */
function sign(memberId: string): string {
  const secret = process.env.SESSION_SECRET || "dev-only-do-not-ship";
  const encoder = new TextEncoder();
  const data = encoder.encode(memberId + secret);
  // Deno-style, small footprint — good enough for a 5-person tool.
  let hash = 0;
  for (const byte of data) hash = (hash * 31 + byte) | 0;
  return `${memberId}.${hash.toString(36)}`;
}

function verify(cookieValue: string): string | null {
  const [memberId, signature] = cookieValue.split(".");
  if (!memberId || !signature) return null;
  const expected = sign(memberId).split(".")[1];
  return expected === signature ? memberId : null;
}

export async function createSession(memberId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign(memberId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function currentMemberId(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;
  return value ? verify(value) : null;
}

/**
 * Server-component helper: fetch the signed-in member or redirect to login.
 * Use this at the top of any protected page.
 */
export async function requireMember(): Promise<Member> {
  const memberId = await currentMemberId();
  if (!memberId) redirect("/login");
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .is("deactivated_at", null)
    .single();
  if (error || !data) {
    await clearSession();
    redirect("/login");
  }
  return data as Member;
}
