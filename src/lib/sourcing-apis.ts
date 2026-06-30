import type { RawCandidate } from "@/modules/scraper/types";

/**
 * Direct candidate-sourcing APIs that run inside the Next app (Vercel) — no separate
 * scraper service needed, because these are plain HTTP/JSON APIs, not headless-browser
 * scraping:
 *   - GitHub Search API (real developers)
 *   - Apify actors for LinkedIn profiles + Facebook job-group posts (managed scraping)
 *
 * Each function no-ops (returns []) when its token/env is missing, so sourcing degrades
 * gracefully. Counts are capped low to respect free tiers.
 */

const GH_MAX = 10;
const APIFY_MAX = 5;       // Apify is pay-per-event — keep low
const JOBBOARD_MAX = 10;   // job listings per board

/**
 * Apify costs money per run (pay-per-event), so it's OFF unless explicitly enabled.
 * Set ENABLE_APIFY=true (plus APIFY_TOKEN) to turn on LinkedIn/Facebook sourcing.
 * This prevents accidental spend during normal use/demo; GitHub + AI web search
 * (both free) cover sourcing otherwise.
 */
function apifyEnabled(): boolean {
  return process.env.ENABLE_APIFY === "true" && Boolean(process.env.APIFY_TOKEN);
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

// ── Apify helper ──────────────────────────────────────────────────────────
async function runApify(actor: string, input: Record<string, unknown>): Promise<unknown[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return [];
  const url = `https://api.apify.com/v2/acts/${actor.replace("/", "~")}/run-sync-get-dataset-items?token=${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`apify ${actor} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as unknown[];
}

// ── LinkedIn (Apify) ──────────────────────────────────────────────────────
// Actor: harvestapi/linkedin-profile-search (M2FMdjRVeF1HPGFcc)
// Input: searchQuery (fuzzy search) + maxProfiles
export async function linkedinCandidates(query: string): Promise<RawCandidate[]> {
  if (!apifyEnabled()) return [];
  const actor = process.env.APIFY_LINKEDIN_ACTOR || "harvestapi/linkedin-profile-search";
  const items = (await runApify(actor, {
    searchQuery: query,
    maxProfiles: APIFY_MAX,
    profileScraperMode: "Short", // cheaper — enough for name/headline/url
  })) as Array<Record<string, unknown>>;

  const str = (...keys: string[]) => (o: Record<string, unknown>) => {
    for (const k of keys) if (typeof o[k] === "string" && o[k]) return o[k] as string;
    return undefined;
  };
  const getName = str("fullName", "name", "firstName");
  const getHeadline = str("headline", "occupation", "jobTitle", "position");
  const getUrl = str("linkedinUrl", "profileUrl", "url", "publicProfileUrl");
  const getLoc = str("location", "locationName", "addressWithCountry");
  const getSummary = str("summary", "about");

  return items.slice(0, APIFY_MAX).map((p) => {
    const c: RawCandidate = { source: "LINKEDIN", headline: getHeadline(p) ?? "LinkedIn profile" };
    const name = getName(p);
    const link = getUrl(p);
    if (name) c.name = name;
    if (link) c.sourceUrl = link;
    const snippet = [getLoc(p), getSummary(p)].filter(Boolean).join(" · ");
    if (snippet) c.snippet = snippet.slice(0, 400);
    return c;
  });
}

// ── JobsDB Thailand (Apify) ───────────────────────────────────────────────
// Actor: shahidirfan/Jobsdb-Scraper
// Input verified from https://apify.com/shahidirfan/Jobsdb-Scraper
export async function jobsdbCandidates(query: string): Promise<RawCandidate[]> {
  if (!apifyEnabled()) return [];
  const items = (await runApify("shahidirfan/Jobsdb-Scraper", {
    keyword: query,
    country: "th",
    results_wanted: JOBBOARD_MAX,
  })) as Array<Record<string, unknown>>;

  return items.slice(0, JOBBOARD_MAX).map((item) => jobboardToCandidate(item, "JOBSDB"));
}

// ── JobThai (Apify) ───────────────────────────────────────────────────────
// Actor: shahidirfan/JobThai-com-Scraper
// Input verified from https://apify.com/shahidirfan/JobThai-com-Scraper
export async function jobthaiCandidates(query: string): Promise<RawCandidate[]> {
  if (!apifyEnabled()) return [];
  const items = (await runApify("shahidirfan/JobThai-com-Scraper", {
    keyword: query,
    resultsWanted: JOBBOARD_MAX,
  })) as Array<Record<string, unknown>>;

  return items.slice(0, JOBBOARD_MAX).map((item) => jobboardToCandidate(item, "JOBTHAI"));
}

function jobboardToCandidate(item: Record<string, unknown>, source: "JOBSDB" | "JOBTHAI"): RawCandidate {
  const str = (...keys: string[]) => {
    for (const k of keys) if (typeof item[k] === "string" && item[k]) return item[k] as string;
    return undefined;
  };
  const title = str("jobTitle", "title", "position") ?? `${source} listing`;
  const company = str("company", "companyName", "employer");
  const location = str("location", "jobLocation", "province");
  const url = str("url", "jobUrl", "link", "applyUrl");
  const snippet = [company, location, str("description", "snippet", "teaser")]
    .filter(Boolean).join(" — ").slice(0, 400);
  const c: RawCandidate = { source, headline: title, name: company };
  if (snippet) c.snippet = snippet;
  if (url) c.sourceUrl = url;
  return c;
}

// ── Facebook job groups (Apify) ───────────────────────────────────────────
// Actor: apify/facebook-groups-scraper
// Input: group URLs + number of posts. The actor does NOT support keyword search —
// it returns recent posts from the group. Claude ranks them at the shortlist step.
export async function facebookCandidates(query: string, groups: string[]): Promise<RawCandidate[]> {
  if (!apifyEnabled() || groups.length === 0) return [];
  // query is kept in the signature so future actors with keyword support can use it;
  // current actor ignores it — we fetch recent posts and let Claude triage.
  void query;
  const items = (await runApify("apify/facebook-groups-scraper", {
    startUrls: groups.map((u) => ({ url: u })),
    maxPosts: APIFY_MAX,
  })) as Array<{ text?: string; url?: string; user?: { name?: string }; authorName?: string }>;
  return items.filter((p) => p.text).slice(0, APIFY_MAX).map((p) => {
    const name = p.user?.name ?? p.authorName;
    const c: RawCandidate = { source: "FACEBOOK", headline: name ? `โพสต์โดย ${name}` : "โพสต์ในกลุ่มหางาน", snippet: p.text!.slice(0, 400) };
    if (name) c.name = name;
    if (p.url) c.sourceUrl = p.url;
    return c;
  });
}
