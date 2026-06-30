import { makeStubSource } from "./_stub.js";

/**
 * FACEBOOK — handled by the Vercel app via Apify (src/lib/sourcing-apis.ts).
 *
 * Facebook requires a managed scraping service (Apify) and group URLs supplied by HR
 * at search time. Running Apify from inside the Cloud Run scraper would duplicate the
 * call and double the cost — so this source is intentionally stubbed here.
 *
 * When ENABLE_APIFY=true + APIFY_TOKEN are set on Vercel, facebookCandidates() in
 * sourcing-apis.ts handles Facebook (with HR-supplied group URLs) and the results are
 * merged into the same shortlist.
 */
export const facebookSource = makeStubSource(
  "FACEBOOK",
  "handled by Vercel+Apify (src/lib/sourcing-apis.ts) — not duplicated here"
);
