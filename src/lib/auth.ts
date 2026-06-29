import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Auth-aware Supabase client (SSR). Separate from `supabaseAdmin` (service role):
 * this one carries the signed-in user's session via cookies and is used ONLY to read
 * who is logged in / sign out. All DATA access still goes through supabaseAdmin in the
 * module queries — auth here is a gate at the app's edge, not a per-row authz rewrite.
 *
 * This tool is for one HR team, so "logged in with an allowed Google account" is the
 * whole policy; we don't need per-user RLS.
 */
/** True when the Supabase auth env is present. When absent, the app runs without a gate. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function createAuthClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // called from a Server Component (read-only cookies) — middleware refreshes instead
          }
        },
      },
    },
  );
}

/** The current signed-in user, or null (also null when auth env is unset). */
export async function getCurrentUser() {
  if (!isAuthConfigured()) return null;
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
