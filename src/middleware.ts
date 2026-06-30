import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth gate. Runs on every matched route: refreshes the Supabase session cookie and,
 * if there's no signed-in user, redirects to /login. Public paths (the login page and
 * the auth callback) are allowed through. When Supabase env isn't configured yet, auth
 * is skipped so the app still renders (degraded) instead of redirect-looping.
 */
const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();

  // Carry/refresh auth cookies on the response.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable or session cookie malformed — treat as logged out
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    return NextResponse.redirect(redirect);
  }
  // Already signed in but sitting on /login → send to the app.
  if (user && pathname.startsWith("/login")) {
    const home = request.nextUrl.clone();
    home.pathname = "/tracker";
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  // Run on everything except: static assets, image optimizer, favicon, the
  // Google-Calendar OAuth callback (Module 4), and the scraper-ingest API
  // (machine-to-machine, authenticated by a shared secret — not a user session).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/google|api/scrape-ingest).*)"],
};
