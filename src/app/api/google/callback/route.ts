import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/google";

/**
 * Google OAuth callback. Exchanges the code for tokens and stores the refresh token
 * in an httpOnly cookie. For this single-HR tool that's enough — no user table needed;
 * the Scheduler reads the cookie to act on the connected calendar. (A multi-user
 * product would persist per-user tokens in the DB instead.)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/scheduler?google=error", url.origin));
  }

  try {
    const tokens = await exchangeCode(code);
    if (tokens.refresh_token) {
      const jar = await cookies();
      jar.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 60, // 60 days
      });
    }
    return NextResponse.redirect(new URL("/scheduler?google=connected", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/scheduler?google=error", url.origin));
  }
}
