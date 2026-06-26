import type { Browser } from "playwright";
import type { RawCandidate } from "../types.js";
import type { Source } from "./index.js";
import { newPage, closeQuietly } from "../browser.js";

/**
 * JOBTHAI source — scrapes public job-search results on jobthai.com.
 *
 * Same caveat as JobsDB: the public side is a job board (employer-posted jobs),
 * not an open CV database, so returned RawCandidates are job postings matched to
 * the query (headline = position, snippet = company/location). The recruiter /
 * Claude uses these as leads, not as finished candidate profiles.
 *
 * Anti-bot reality: JobThai's markup is server-rendered but class names are not
 * stable across redesigns. We target a few likely containers and fall back to
 * generic anchors. On any layout change or block, the server's per-source
 * try/catch turns failure into [].
 */

const MAX_RESULTS = 20;
const ORIGIN = "https://www.jobthai.com";

export const jobthaiSource: Source = {
  name: "JOBTHAI",

  async scrape(browser: Browser, query: string): Promise<RawCandidate[]> {
    const { context, page } = await newPage(browser);
    try {
      const url = `${ORIGIN}/en/jobs?keyword=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // JobThai result cards are anchors pointing at /en/job/<id> (or /job/).
      // This is more robust than chasing volatile class names.
      const linkSelector = 'a[href*="/job/"], a[href*="/jobs/"]';
      await page
        .waitForSelector(linkSelector, { timeout: 8_000 })
        .catch(() => {});

      const results = await page.$$eval(
        linkSelector,
        (nodes, limit) => {
          const seen = new Set<string>();
          const out: { title: string; href: string; snippet: string }[] = [];
          for (const node of nodes) {
            const a = node as HTMLAnchorElement;
            const href = a.href;
            if (!href || seen.has(href)) continue;
            seen.add(href);

            // The card body is usually the anchor's parent; grab its text as a
            // blob and use the anchor text (or a heading) as the title.
            const card = a.closest("li, article, div") ?? a;
            const heading =
              card.querySelector("h2, h3, h4")?.textContent?.trim() ??
              a.textContent?.trim() ??
              "";
            const blob = (card.textContent ?? "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 400);

            if (!heading) continue;
            out.push({ title: heading, href, snippet: blob });
            if (out.length >= limit) break;
          }
          return out;
        },
        MAX_RESULTS
      );

      return results.map((r) => {
        const candidate: RawCandidate = {
          source: "JOBTHAI",
          headline: r.title,
          snippet: r.snippet || undefined,
        };
        const abs = toAbsoluteUrl(r.href);
        if (abs) candidate.sourceUrl = abs;
        return candidate;
      });
    } finally {
      await closeQuietly(context);
    }
  },
};

function toAbsoluteUrl(href: string): string | undefined {
  if (!href) return undefined;
  try {
    const u = new URL(href, ORIGIN);
    return u.protocol === "http:" || u.protocol === "https:"
      ? u.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
