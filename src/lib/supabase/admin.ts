import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses Row Level Security entirely.
 * Server-side only (API routes / Server Actions). Never import this
 * into a "use client" component or expose SUPABASE_SERVICE_ROLE_KEY
 * with the NEXT_PUBLIC_ prefix.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
