import type { RawCandidate } from "@/modules/scraper/types";

/**
 * Direct candidate-sourcing APIs that run inside the Next app (Vercel) — no separate
 * scraper service needed, because these are plain HTTP/JSON APIs, not headless-browser
 * scraping:
 *   - GitHub Search API (real developers)
 *   - Firecrawl (JobsDB/JobThai job listings — public pages, no login wall)
 *
 * Each function no-ops (returns []) when its token/env is missing, so sourcing degrades
 * gracefully. Counts are capped low to respect free tiers.
 */

const GH_MAX = 20;         // GitHub Search API is free and unmetered for this use — the
                           // real constraint is just its per-endpoint rate limit, well
                           // above what one sourcing round needs.
const JOBBOARD_MAX = 15;  // job listings per board

function firecrawlEnabled(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

// ── GitHub ────────────────────────────────────────────────────────────────
export async function githubCandidates(query: string): Promise<RawCandidate[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "recruiting-pipeline-tool",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(
    `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=${GH_MAX}`,
    { headers },
  );
  if (!res.ok) throw new Error(`github ${res.status}`);
  const data = (await res.json()) as { items?: { login: string; html_url: string }[] };

  return Promise.all(
    (data.items ?? []).slice(0, GH_MAX).map(async (u) => {
      try {
        const pr = await fetch(`https://api.github.com/users/${u.login}`, { headers });
        const p = (await pr.json()) as {
          name?: string | null; bio?: string | null; company?: string | null;
          location?: string | null; public_repos?: number;
        };
        const snippet = [p.bio, p.company, p.location, p.public_repos != null && `${p.public_repos} repos`]
          .filter(Boolean).join(" · ");
        const c: RawCandidate = { source: "GITHUB", name: p.name ?? u.login, headline: p.bio ?? `GitHub: @${u.login}`, sourceUrl: u.html_url };
        if (snippet) c.snippet = snippet;
        return c;
      } catch {
        return { source: "GITHUB", name: u.login, sourceUrl: u.html_url } as RawCandidate;
      }
    }),
  );
}

// ── Firecrawl scrape helper ─────────────────────────────────────────────────
// JobsDB/JobThai are public job-listing pages (no login wall), so a plain scrape
// of the search-results URL is enough — no headless browser needed. Firecrawl
// renders the page (client-side JS included) and returns markdown + the page's
// links, which we pattern-match the same way the old Playwright sources did.
async function firecrawlScrape(url: string): Promise<{ markdown: string; links: string[] } | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown", "links"] }),
  });
  if (!res.ok) throw new Error(`firecrawl ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { data?: { markdown?: string; links?: string[] } };
  return { markdown: body.data?.markdown ?? "", links: body.data?.links ?? [] };
}

// ── JobsDB Thailand (Firecrawl) ──────────────────────────────────────────────
// Public job-search results on th.jobsdb.com — same page the old Playwright
// source targeted, now scraped via Firecrawl instead of a headless browser.
export async function jobsdbCandidates(query: string): Promise<RawCandidate[]> {
  if (!firecrawlEnabled()) return [];
  const url = `https://th.jobsdb.com/th/jobs?keywords=${encodeURIComponent(query)}`;
  const page = await firecrawlScrape(url);
  if (!page) return [];
  return jobListingsFromMarkdown(page, "JOBSDB", "th.jobsdb.com");
}

// ── JobThai (Firecrawl) ───────────────────────────────────────────────────
export async function jobthaiCandidates(query: string): Promise<RawCandidate[]> {
  if (!firecrawlEnabled()) return [];
  const url = `https://www.jobthai.com/en/jobs?keyword=${encodeURIComponent(query)}`;
  const page = await firecrawlScrape(url);
  if (!page) return [];
  return jobListingsFromMarkdown(page, "JOBTHAI", "jobthai.com");
}

/**
 * Turn a scraped job-board page into RawCandidates: each markdown link line
 * `[Job Title](url)` whose href points at a job-detail page (matched by
 * `hostFilter`) becomes one listing. Headline = link text, sourceUrl = href.
 * Heuristic (markdown structure varies by site) — falls back to [] rather than
 * guessing wrong, matching the old scraper's "never crash the request" rule.
 */
function jobListingsFromMarkdown(
  page: { markdown: string; links: string[] },
  source: "JOBSDB" | "JOBTHAI",
  hostFilter: string,
): RawCandidate[] {
  const seen = new Set<string>();
  const out: RawCandidate[] = [];
  const linkPattern = /\[([^\]]{4,120})\]\((https?:\/\/[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkPattern.exec(page.markdown)) && out.length < JOBBOARD_MAX) {
    const [, title, href] = m;
    if (!href.includes(hostFilter) || !/\/job/i.test(href)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ source, headline: title.trim(), sourceUrl: href });
  }
  return out;
}
