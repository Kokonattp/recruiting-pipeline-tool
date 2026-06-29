import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";

/**
 * Supabase OAuth callback (sign-in). Exchanges the returned code for a session cookie,
 * then sends the user into the app. This is the LOGIN flow — distinct from
 * /api/google/callback, which connects Google Calendar for Module 4.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/tracker", url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=1", url.origin));
}
