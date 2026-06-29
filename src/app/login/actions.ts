"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAuthClient } from "@/lib/auth";

/** Start Google OAuth via Supabase. Redirects the user to Google's consent screen. */
export async function signInWithGoogle() {
  const supabase = await createAuthClient();
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?error=1");
  redirect(data.url);
}

/** Sign out and return to the login screen. */
export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}
