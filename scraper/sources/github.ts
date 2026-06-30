import type { Browser } from "playwright";
import type { RawCandidate } from "../types.js";
import type { Source } from "./index.js";

/**
 * GITHUB source — finds real developers via the public GitHub Search API.
 *
 * Unlike the other sources this doesn't drive a browser: GitHub has a documented,
 * ToS-allowed public API, so we just fetch it. That makes it the most reliable
 * candidate source for a technical role — real people, real profiles, no anti-bot.
 *
 * Query: we search users (the AI-generated query already carries skills/keywords).
 * For each hit we pull the user's public profile (name, bio, company, location, blog)
 * to enrich the record. Unauthenticated calls are rate-limited (~10 search req/min),
 * which is plenty for one sourcing run; a GITHUB_TOKEN env raises the limit if set.
 */

const API = "https://api.github.com";
const MAX_RESULTS = 30; // GitHub allows up to 100/req; 30 keeps profile-enrichment fast

export const githubSource: Source = {
  name: "GITHUB",

  // browser is unused (API-based) but kept for the uniform Source interface.
  async scrape(_browser: Browser, query: string): Promise<RawCandidate[]> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "recruiting-pipeline-tool",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    const searchUrl = `${API}/search/users?q=${encodeURIComponent(query)}&per_page=${MAX_RESULTS}`;
    const res = await fetch(searchUrl, { headers });
    if (!res.ok) throw new Error(`github search ${res.status}`);

    const data = (await res.json()) as { items?: { login: string; html_url: string }[] };
    const logins = (data.items ?? []).slice(0, MAX_RESULTS);

    // Enrich each hit with the public profile. Done in parallel but tolerant: a failed
    // profile fetch falls back to just the login + url.
    const candidates = await Promise.all(
      logins.map(async (u) => {
        try {
          const pr = await fetch(`${API}/users/${u.login}`, { headers });
          if (!pr.ok) throw new Error(String(pr.status));
          const p = (await pr.json()) as {
            name?: string | null;
            bio?: string | null;
            company?: string | null;
            location?: string | null;
            blog?: string | null;
            public_repos?: number;
          };
          const snippet = [p.bio, p.company, p.location, p.blog && `web: ${p.blog}`, p.public_repos != null && `${p.public_repos} repos`]
            .filter(Boolean)
            .join(" · ");
          const candidate: RawCandidate = {
            source: "GITHUB",
            name: p.name ?? u.login,
            headline: p.bio ?? `GitHub: @${u.login}`,
            sourceUrl: u.html_url,
          };
          if (snippet) candidate.snippet = snippet;
          return candidate;
        } catch {
          return { source: "GITHUB", name: u.login, sourceUrl: u.html_url } as RawCandidate;
        }
      }),
    );

    return candidates;
  },
};
