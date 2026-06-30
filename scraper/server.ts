import express, { type Request, type Response } from "express";
import { chromium, type Browser } from "playwright";

import type {
  RawCandidate,
  ScrapeRequest,
  ScrapeResponse,
  SearchQuery,
  Source as SourceName,
} from "./types.js";
import { getSource } from "./sources/index.js";

const PORT = Number(process.env.PORT) || 4000;
const INGEST_SECRET = process.env.SCRAPER_INGEST_SECRET;

const VALID_SOURCES: SourceName[] = [
  "LINKEDIN",
  "JOBSDB",
  "JOBBKK",
  "JOBTHAI",
  "FACEBOOK",
  "GITHUB",
  "WEB",
  "REFERRAL",
  "MANUAL",
];

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "recruiting-tool-scraper" });
});

app.post("/scrape", async (req: Request, res: Response) => {
  // --- Auth -----------------------------------------------------------------
  if (!INGEST_SECRET) {
    console.error("SCRAPER_INGEST_SECRET is not set — refusing all requests.");
    return res.status(500).json({ error: "server misconfigured" });
  }
  const body = req.body as Partial<ScrapeRequest> | undefined;
  if (!body || body.secret !== INGEST_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // --- Validate -------------------------------------------------------------
  const queries = normalizeQueries(body.queries);
  if (!queries.length) {
    return res
      .status(400)
      .json({ error: "queries must be a non-empty array of { source, query }" });
  }

  // --- Scrape ---------------------------------------------------------------
  // One shared browser for the whole request. Each source opens/closes its own
  // page/context. Any single source failing is caught and skipped.
  let browser: Browser | undefined;
  const candidates: RawCandidate[] = [];

  try {
    browser = await chromium.launch({ headless: true });

    // Run sources sequentially to keep memory predictable on small containers.
    for (const q of queries) {
      const source = getSource(q.source);
      if (!source) {
        console.warn(
          `[${q.source}] no scraper registered (human-entered source). Skipping.`
        );
        continue;
      }
      try {
        const found = await source.scrape(browser, q.query);
        console.log(`[${q.source}] returned ${found.length} candidate(s).`);
        candidates.push(...found);
      } catch (err) {
        // Anti-bot block, timeout, or layout change — log and keep going.
        console.error(
          `[${q.source}] scrape failed: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  } catch (err) {
    console.error(
      `Failed to launch browser: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return res.status(500).json({ error: "scraper failed to start" });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  const response: ScrapeResponse = { candidates };
  return res.json(response);
});

/** Keep only well-formed queries with a known source and non-empty text. */
function normalizeQueries(input: unknown): SearchQuery[] {
  if (!Array.isArray(input)) return [];
  const out: SearchQuery[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const { source, query, rationale } = item as Record<string, unknown>;
    if (
      typeof source === "string" &&
      VALID_SOURCES.includes(source as SourceName) &&
      typeof query === "string" &&
      query.trim().length > 0
    ) {
      out.push({
        source: source as SourceName,
        query: query.trim(),
        rationale: typeof rationale === "string" ? rationale : undefined,
      });
    }
  }
  return out;
}

app.listen(PORT, () => {
  console.log(`Scraper service listening on port ${PORT}`);
  if (!INGEST_SECRET) {
    console.warn(
      "WARNING: SCRAPER_INGEST_SECRET is not set. /scrape will reject all requests until it is."
    );
  }
});
