import { createClient } from "@supabase/supabase-js";

/**
 * Minimal schema typing. supabase-js infers row types as `never` without a Database
 * generic, which makes every insert/update a type error. We don't generate full types
 * from the live DB (that needs a connection), so each table is typed permissively here
 * — enough to let writes through while keeping a single typed client. Row *reads* are
 * narrowed by the mappers in lib/mappers.ts.
 */
type AnyRow = Record<string, unknown>;
type Table = { Row: AnyRow; Insert: AnyRow; Update: AnyRow; Relationships: [] };
interface Database {
  public: {
    Tables: {
      job_descriptions: Table;
      candidates: Table;
      applications: Table;
      scrape_runs: Table;
      screening_results: Table;
      interviews: Table;
      sourcing_shown: Table;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

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

/** True when the server-side Supabase env is present. Lets pages degrade to an empty
 *  state (instead of throwing) before the database is wired. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

/** Server-side admin client (service role). Lazily created so missing envs don't crash the build. */
let _admin: ReturnType<typeof createClient<Database>> | null = null;
export function supabaseAdmin() {
  if (_admin) return _admin;
  _admin = createClient<Database>(assert(url, "NEXT_PUBLIC_SUPABASE_URL"), assert(serviceKey, "SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  return _admin;
}

/** Browser/client read client (anon key). */
export function createBrowserSupabase() {
  return createClient<Database>(
    assert(url, "NEXT_PUBLIC_SUPABASE_URL"),
    assert(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
