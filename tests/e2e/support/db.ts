/**
 * Direct Supabase access for E2E setup and teardown. Uses the service_role
 * key from the local .env.local (loaded by dotenv). All helpers here are
 * meant to be called from Playwright hooks, not from tests themselves.
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local because Playwright doesn't do it automatically.
config({ path: resolve(process.cwd(), ".env.local") });

let cached: SupabaseClient | null = null;

export function admin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "E2E setup needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** A short unique tag to identify rows created by a given test. */
export function testTag(): string {
  return `E2E-${Math.random().toString(36).slice(2, 8)}`;
}

/** Delete every expense whose description contains the tag. */
export async function cleanupExpensesByTag(tag: string): Promise<void> {
  const db = admin();
  const { data: expenses } = await db
    .from("expenses")
    .select("id")
    .ilike("description", `%${tag}%`);
  if (!expenses || expenses.length === 0) return;
  const ids = expenses.map((e) => e.id);
  await db.from("receipts").delete().in("expense_id", ids);
  await db.from("expenses").delete().in("id", ids);
}

/** Delete every payment whose note contains the tag. */
export async function cleanupPaymentsByTag(tag: string): Promise<void> {
  const db = admin();
  await db.from("payments").delete().ilike("note", `%${tag}%`);
}

/** Get a member by first_name. Throws if missing. */
export async function memberByName(firstName: string) {
  const db = admin();
  const { data, error } = await db
    .from("members")
    .select("*")
    .eq("first_name", firstName.toLowerCase())
    .single();
  if (error || !data) throw new Error(`member ${firstName} not found`);
  return data;
}

/** Silence unused-import warnings for readFileSync in case future helpers need it. */
export { readFileSync };
