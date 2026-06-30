import type { Browser } from "playwright";
import type { RawCandidate } from "../types.js";
import type { Source } from "./index.js";

/**
 * FACEBOOK source — via Apify's facebook-groups-scraper actor.
 *
 * We can't (and shouldn't) scrape Facebook ourselves: it requires login and actively
 * blocks automation. Apify is a managed scraping service that handles login/proxy/anti-
 * bot on their side and exposes results over a normal API — so we just call it.
 *
 * What it returns: posts from public job/hiring Facebook GROUPS that match the query
 * (people posting "looking for work / open to AI roles"). These are leads, not polished
 * profiles — mapped onto RawCandidate (snippet = post text, sourceUrl = post link) for
 * HR + Claude to triage like any other source.
 *
 * Requires APIFY_TOKEN. Without it this source is skipped (returns []), so the rest of
 * sourcing keeps working. The query already carries role/skill keywords.
 */

const ACTOR = "apify~facebook-groups-scraper";
const MAX_POSTS = 25;

// Public Thai job/hiring groups to search. Kept here (not hard-coded per query) so it's
// easy to extend; the actor searches these groups for the query terms.
const JOB_GROUPS = [
  "https://www.facebook.com/groups/jobthaidev",
  "https://www.facebook.com/groups/programmerthai",
];

export const facebookSource: Source = {
  name: "FACEBOOK",

  async scrape(_browser: Browser, query: string): Promise<RawCandidate[]> {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      console.warn("[FACEBOOK] APIFY_TOKEN not set — skipping.");
      return [];
    }

    // run-sync-get-dataset-items: starts the actor, waits, returns the dataset in one call.
    const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: JOB_GROUPS.map((u) => ({ url: u })),
        searchQueries: [query],
        maxPosts: MAX_POSTS,
        maxPostsPerSearch: MAX_POSTS,
      }),
    });

    if (!res.ok) {
      throw new Error(`apify ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const items = (await res.json()) as Array<{
      text?: string;
      url?: string;
      user?: { name?: string };
      authorName?: string;
    }>;

    return items
      .filter((p) => p.text)
      .slice(0, MAX_POSTS)
      .map((p) => {
        const name = p.user?.name ?? p.authorName;
        const candidate: RawCandidate = {
          source: "FACEBOOK",
          headline: name ? `โพสต์โดย ${name}` : "โพสต์ในกลุ่มหางาน",
          snippet: p.text!.slice(0, 400),
        };
        if (name) candidate.name = name;
        if (p.url) candidate.sourceUrl = p.url;
        return candidate;
      });
  },
};
