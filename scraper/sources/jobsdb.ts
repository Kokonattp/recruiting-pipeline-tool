import type { Browser } from "playwright";
import type { RawCandidate } from "../types.js";
import type { Source } from "./index.js";
import { newPage, closeQuietly } from "../browser.js";

/**
 * JOBSDB source — scrapes the public job-search results on th.jobsdb.com.
 *
 * Note on "candidates": JobsDB is a job-listings board, not a CV database (the
 * talent-search side requires an employer login). So what we return here are job
 * postings that match the query — useful context for the recruiter / for Claude
 * to reason over, mapped onto the RawCandidate shape (headline = job title,
 * snippet = company + location + teaser). This is intentional and honest about
 * what's publicly scrapeable without a session.
 *
 * Anti-bot reality: JobsDB (SEEK group) renders results client-side and can
 * change data-automation attributes without notice, and may rate-limit. If the
 * layout shifts, this returns [] via the server's per-source try/catch.
 */

const MAX_RESULTS = 20;
const ORIGIN = "https://th.jobsdb.com";

export const jobsdbSource: Source = {
  name: "JOBSDB",

  async scrape(browser: Browser, query: string): Promise<RawCandidate[]> {
    const { context, page } = await newPage(browser);
    try {
      const url = `${ORIGIN}/th/jobs?keywords=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // SEEK/JobsDB tags result cards with data-automation="job-card" (or
      // "jobCard"). We wait briefly for client-side render, then read what's there.
      await page
        .waitForSelector(
          '[data-automation="job-card"], article[data-card-type="JobCard"], article',
          { timeout: 8_000 }
        )
        .catch(() => {});

      const results = await page.$$eval(
        '[data-automation="job-card"], article[data-card-type="JobCard"], article',
        (nodes, limit) =>
          nodes.slice(0, limit).map((el) => {
            const titleEl =
              el.querySelector('[data-automation="jobTitle"]') ??
              el.querySelector("a h3, h3 a, h3, a");
            const link = (titleEl?.closest("a") ??
              el.querySelector("a")) as HTMLAnchorElement | null;
            const company = el.querySelector(
              '[data-automation="jobCompany"]'
            )?.textContent;
            const location = el.querySelector(
              '[data-automation="jobLocation"]'
            )?.textContent;
            const teaser = el.querySelector(
              '[data-automation="jobShortDescription"]'
            )?.textContent;

            return {
              title: titleEl?.textContent?.trim() ?? "",
              href: link?.href ?? "",
              snippet: [company, location, teaser]
                .map((s) => s?.trim())
                .filter(Boolean)
                .join(" — "),
            };
          }),
        MAX_RESULTS
      );

      return results
        .filter((r) => r.title)
        .map((r) => {
          const candidate: RawCandidate = {
            source: "JOBSDB",
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
