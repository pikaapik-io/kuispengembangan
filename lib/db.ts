import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only. Never import this from a client component — it holds the
// service role key, which bypasses RLS entirely.
if (typeof window !== "undefined") {
  throw new Error("lib/db.ts must never be imported on the client");
}

// Without this, a slow/degraded Supabase leaves requests hanging until
// Vercel's own function timeout (up to 300s) — tying up a serverless slot
// for minutes per request instead of failing fast so the caller can retry.
const FETCH_TIMEOUT_MS = 8_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
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
    global: { fetch: fetchWithTimeout },
  });
  return client;
}

export const db: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
