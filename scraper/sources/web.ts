import type { Browser } from "playwright";
import type { RawCandidate } from "../types.js";
import type { Source } from "./index.js";
import { newPage, closeQuietly } from "../browser.js";

/**
 * WEB source — general web search results (titles + snippets + links).
 *
 * Anti-bot reality: Google aggressively blocks automated/headless traffic and
 * frequently shows consent walls or CAPTCHAs. Bing is far more tolerant of
 * scripted access, so we use Bing as the primary engine. Even so, search engines
 * change their markup often and may rate-limit; the server's per-source try/catch
 * means a block here just yields an empty list, not a failed request.
 */

const MAX_RESULTS = 15;

export const webSource: Source = {
  name: "WEB",

  async scrape(browser: Browser, query: string): Promise<RawCandidate[]> {
    const { context, page } = await newPage(browser);
    try {
      const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`;
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // Bing organic results live in <li class="b_algo">. Each has a heading
      // link (the title + href) and a caption block (the snippet).
      await page.waitForSelector("li.b_algo", { timeout: 8_000 }).catch(() => {});

      const results = await page.$$eval(
        "li.b_algo",
        (nodes, limit) =>
          nodes.slice(0, limit).map((el) => {
            const link = el.querySelector("h2 a") as HTMLAnchorElement | null;
            const caption = el.querySelector(".b_caption p, .b_lineclamp2, p");
            return {
              title: link?.textContent?.trim() ?? "",
              href: link?.href ?? "",
              snippet: caption?.textContent?.trim() ?? "",
            };
          }),
        MAX_RESULTS
      );

      return results
        .filter((r) => r.title || r.snippet)
        .map((r) => {
          const candidate: RawCandidate = {
            source: "WEB",
            headline: r.title || undefined,
            snippet: r.snippet || undefined,
          };
          if (isValidUrl(r.href)) candidate.sourceUrl = r.href;
          return candidate;
        });
    } finally {
      await closeQuietly(context);
    }
  },
};

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
