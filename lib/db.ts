import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only. Never import this from a client component — it holds the
// service role key, which bypasses RLS entirely.
if (typeof window !== "undefined") {
  throw new Error("lib/db.ts must never be imported on the client");
}

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (client) return client;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const db: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
