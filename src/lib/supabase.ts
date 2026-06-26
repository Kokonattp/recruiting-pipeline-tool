import { createClient } from "@supabase/supabase-js";

/**
 * Supabase clients.
 *
 * - `supabaseAdmin` (server-only): uses the service-role key. Bypasses RLS.
 *   Use it inside Server Actions / route handlers / the scraper-ingest API.
 *   NEVER import this into a client component.
 * - `createBrowserSupabase` (client): uses the anon key, for any client-side reads.
 *
 * Auth (login HR) can be layered on later via @supabase/ssr without changing
 * the data-access call sites, because all DB access goes through the modules/
 * query + action helpers, not raw clients scattered in components.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assert(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing env ${name}. Copy .env.example → .env.local and fill it in.`,
    );
  }
  return value;
}

/** Server-side admin client (service role). Lazily created so missing envs don't crash the build. */
let _admin: ReturnType<typeof createClient> | null = null;
export function supabaseAdmin() {
  if (_admin) return _admin;
  _admin = createClient(assert(url, "NEXT_PUBLIC_SUPABASE_URL"), assert(serviceKey, "SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  return _admin;
}

/** Browser/client read client (anon key). */
export function createBrowserSupabase() {
  return createClient(
    assert(url, "NEXT_PUBLIC_SUPABASE_URL"),
    assert(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
