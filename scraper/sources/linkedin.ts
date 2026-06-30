import { makeStubSource } from "./_stub.js";

/**
 * LINKEDIN — handled by the Vercel app via Apify (src/lib/sourcing-apis.ts).
 *
 * LinkedIn requires a managed scraping service (Apify) to avoid ToS violations and
 * anti-bot blocks. Running Apify from inside the Cloud Run scraper would duplicate the
 * call and double the cost — so this source is intentionally stubbed here.
 *
 * When ENABLE_APIFY=true + APIFY_TOKEN are set on Vercel, linkedinCandidates() in
 * sourcing-apis.ts handles LinkedIn and the results are merged into the same shortlist.
 */
export const linkedinSource = makeStubSource(
  "LINKEDIN",
  "handled by Vercel+Apify (src/lib/sourcing-apis.ts) — not duplicated here"
);
