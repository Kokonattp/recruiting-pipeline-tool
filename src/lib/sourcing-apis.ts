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
const APIFY_MAX = 10;

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
export async function linkedinCandidates(query: string): Promise<RawCandidate[]> {
  if (!process.env.APIFY_TOKEN) return [];
  const actor = process.env.APIFY_LINKEDIN_ACTOR || "apimaestro/linkedin-profile-search-scraper-no-cookies";
  const items = (await runApify(actor, { searchQuery: query, keywords: query, maxItems: APIFY_MAX })) as Array<{
    fullName?: string; name?: string; headline?: string; jobTitle?: string;
    profileUrl?: string; url?: string; location?: string; summary?: string;
  }>;
  return items.slice(0, APIFY_MAX).map((p) => {
    const c: RawCandidate = { source: "LINKEDIN", headline: p.headline ?? p.jobTitle ?? "LinkedIn profile" };
    const name = p.fullName ?? p.name;
    const link = p.profileUrl ?? p.url;
    if (name) c.name = name;
    if (link) c.sourceUrl = link;
    const snippet = [p.location, p.summary].filter(Boolean).join(" · ");
    if (snippet) c.snippet = snippet.slice(0, 400);
    return c;
  });
}

// ── Facebook job groups (Apify) ───────────────────────────────────────────
export async function facebookCandidates(query: string): Promise<RawCandidate[]> {
  if (!process.env.APIFY_TOKEN) return [];
  const groups = ["https://www.facebook.com/groups/jobthaidev", "https://www.facebook.com/groups/programmerthai"];
  const items = (await runApify("apify/facebook-groups-scraper", {
    startUrls: groups.map((u) => ({ url: u })),
    searchQueries: [query],
    maxPosts: APIFY_MAX,
    maxPostsPerSearch: APIFY_MAX,
  })) as Array<{ text?: string; url?: string; user?: { name?: string }; authorName?: string }>;
  return items.filter((p) => p.text).slice(0, APIFY_MAX).map((p) => {
    const name = p.user?.name ?? p.authorName;
    const c: RawCandidate = { source: "FACEBOOK", headline: name ? `โพสต์โดย ${name}` : "โพสต์ในกลุ่มหางาน", snippet: p.text!.slice(0, 400) };
    if (name) c.name = name;
    if (p.url) c.sourceUrl = p.url;
    return c;
  });
}
