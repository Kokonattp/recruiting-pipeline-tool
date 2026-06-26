/**
 * Shared types for the scraper service.
 *
 * IMPORTANT: These field names MUST stay identical to the contract the Next.js
 * app depends on. Do NOT import these from the Next app — this service is fully
 * standalone. If you change a field name here, change it in the Next app too.
 */

/** The set of supported candidate sources. */
export type Source =
  | "LINKEDIN"
  | "JOBSDB"
  | "JOBBKK"
  | "JOBTHAI"
  | "FACEBOOK"
  | "WEB"
  | "REFERRAL"
  | "MANUAL";

/** One AI-generated search query, scoped to a single source. */
export interface SearchQuery {
  source: Source;
  query: string;
  rationale?: string;
}

/** A raw candidate record scraped from a listing. All fields except `source` are optional. */
export interface RawCandidate {
  source: Source;
  /** Must be a valid URL if present. */
  sourceUrl?: string;
  name?: string;
  headline?: string;
  /** Raw text blob from the listing. */
  snippet?: string;
}

/** Request body for POST /scrape. */
export interface ScrapeRequest {
  secret: string;
  queries: SearchQuery[];
}

/** Response body for POST /scrape. */
export interface ScrapeResponse {
  candidates: RawCandidate[];
}
