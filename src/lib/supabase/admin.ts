import { createClient } from "@supabase/supabase-js";

/**
 * Admin (service_role) Supabase client. Bypasses RLS. Server-only.
 *
 * Every page and server action in this app runs on the server, so this is the
 * client we use for all queries. RLS is set to deny anon; server code decides
 * who sees what based on the signed-cookie session (see src/lib/auth.ts).
 *
 * NEVER import this from a "use client" file. Doing so would leak the service
 * role key into the browser bundle.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
