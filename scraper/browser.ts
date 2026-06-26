import type { Browser, BrowserContext, Page } from "playwright";

/**
 * Per-source timeout. Sites can be slow or hang behind anti-bot challenges, so
 * we cap each source's work and move on rather than blocking the whole request.
 */
export const SOURCE_TIMEOUT_MS = 20_000;

/**
 * A normal-looking desktop Chrome User-Agent. Job sites frequently block the
 * default Playwright/headless UA, so we present as a regular browser. This is
 * NOT a guarantee against blocking — see the per-source try/catch in server.ts.
 */
export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Create a fresh browser context + page with sane defaults.
 *
 * One browser instance is shared across a request (see server.ts), but each
 * source gets its own context/page so they're isolated (cookies, etc.) and can
 * be cleanly closed after the source finishes.
 */
export async function newPage(
  browser: Browser
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "en-US",
    viewport: { width: 1366, height: 768 },
    // Many TH job sites serve a Thai locale; en helps keep selectors stable but
    // accept-language hints both so content still loads.
    extraHTTPHeaders: { "accept-language": "en-US,en;q=0.9,th;q=0.8" },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(SOURCE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(SOURCE_TIMEOUT_MS);

  return { context, page };
}

/** Best-effort cleanup. Never throws — used in finally blocks. */
export async function closeQuietly(
  context: BrowserContext | undefined
): Promise<void> {
  if (!context) return;
  try {
    await context.close();
  } catch {
    // ignore — context may already be gone
  }
}
