import type { Browser } from "playwright";
import type { RawCandidate } from "../types.js";
import type { Source } from "./index.js";

/**
 * LINKEDIN source — via an Apify LinkedIn actor.
 *
 * LinkedIn requires a logged-in session and blocks automation, and its ToS prohibit
 * scraping — so we don't do it ourselves. Apify is a managed service that handles the
 * session/proxy/anti-bot and returns results over an API; we just call it.
 *
 * Returns public LinkedIn profiles matching the query (name, headline, profile URL) —
 * the highest-signal source for a technical hire. Mapped onto RawCandidate.
 *
 * Requires APIFY_TOKEN. Without it this source is skipped (returns []). The actor id is
 * overridable via APIFY_LINKEDIN_ACTOR since Apify's catalog changes over time.
 */

const DEFAULT_ACTOR = "apimaestro~linkedin-profile-search-scraper-no-cookies";
const MAX_RESULTS = 10; // capped low to stay within Apify's free tier

export const linkedinSource: Source = {
  name: "LINKEDIN",

  async scrape(_browser: Browser, query: string): Promise<RawCandidate[]> {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      console.warn("[LINKEDIN] APIFY_TOKEN not set — skipping.");
      return [];
    }
    const actor = (process.env.APIFY_LINKEDIN_ACTOR || DEFAULT_ACTOR).replace("/", "~");

    const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQuery: query,
        keywords: query,
        maxItems: MAX_RESULTS,
      }),
    });

    if (!res.ok) {
      throw new Error(`apify linkedin ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const items = (await res.json()) as Array<{
      fullName?: string;
      name?: string;
      headline?: string;
      jobTitle?: string;
      profileUrl?: string;
      url?: string;
      location?: string;
      summary?: string;
    }>;

    return items.slice(0, MAX_RESULTS).map((p) => {
      const name = p.fullName ?? p.name;
      const link = p.profileUrl ?? p.url;
      const candidate: RawCandidate = {
        source: "LINKEDIN",
        headline: p.headline ?? p.jobTitle ?? "LinkedIn profile",
      };
      if (name) candidate.name = name;
      if (link) candidate.sourceUrl = link;
      const snippet = [p.location, p.summary].filter(Boolean).join(" · ");
      if (snippet) candidate.snippet = snippet.slice(0, 400);
      return candidate;
    });
  },
};
