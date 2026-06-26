import { z } from "zod";
import { SOURCES, type Source } from "@/lib/types";

/**
 * Contract shared by the three parts of Module 1:
 *   web app (gen query / rank / approve)  ⇄  scraper service (Playwright)  ⇄  DB
 * Everything that crosses a boundary is a zod schema so bad data fails loudly.
 */

/** A search query the AI generated for one source, ready to hand to the scraper. */
export const SearchQuerySchema = z.object({
  source: z.enum(SOURCES as [Source, ...Source[]]),
  query: z.string().min(1),
  rationale: z.string(), // why this query fits the JD — shown to HR for transparency
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/** What the AI returns when turning a JD into per-source queries. */
export const QueryPlanSchema = z.object({
  roleSummary: z.string(),
  mustHaveSkills: z.array(z.string()),
  queries: z.array(SearchQuerySchema).min(1),
});
export type QueryPlan = z.infer<typeof QueryPlanSchema>;

/** One raw candidate as the scraper service found it (pre-normalization). */
export const RawCandidateSchema = z.object({
  source: z.enum(SOURCES as [Source, ...Source[]]),
  sourceUrl: z.string().url().optional(),
  name: z.string().optional(),
  headline: z.string().optional(),
  snippet: z.string().optional(), // raw text blob from the listing/profile
});
export type RawCandidate = z.infer<typeof RawCandidateSchema>;

/** A candidate after AI normalization + ranking against the JD — what HR reviews. */
export const RankedCandidateSchema = z.object({
  name: z.string(),
  headline: z.string(),
  source: z.enum(SOURCES as [Source, ...Source[]]),
  sourceUrl: z.string().url().nullable(),
  email: z.string().nullable(),
  fitScore: z.number().min(0).max(100), // overall fit 0-100
  reasons: z.array(z.string()), // why this person fits — HR's decision aid
  concerns: z.array(z.string()), // gaps / things to verify
});
export type RankedCandidate = z.infer<typeof RankedCandidateSchema>;

export const RankResultSchema = z.object({
  shortlist: z.array(RankedCandidateSchema),
});
export type RankResult = z.infer<typeof RankResultSchema>;

/** Body the scraper service POSTs to /api/scrape-ingest. */
export const IngestPayloadSchema = z.object({
  secret: z.string(),
  jobId: z.string(),
  candidates: z.array(RawCandidateSchema),
});
export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
