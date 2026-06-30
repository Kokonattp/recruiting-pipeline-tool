import { structured, CONTENT_MODEL } from "@/lib/claude";
import {
  QueryPlanSchema,
  RankResultSchema,
  type QueryPlan,
  type RankResult,
  type RawCandidate,
} from "./types";
import { SOURCE_LABELS, type Source } from "@/lib/types";

/**
 * AI step 1 — turn a Job Description into concrete, source-specific search queries.
 * Each source phrases search differently (LinkedIn boolean vs JobsDB keywords vs a
 * Google site: query), so we let Claude tailor one query per source and explain why.
 */
export async function planQueries(
  jdText: string,
  sources: Source[],
): Promise<QueryPlan> {
  const sourceList = sources.map((s) => `${s} (${SOURCE_LABELS[s]})`).join(", ");

  return structured<QueryPlan>({
    system: [
      "You are a senior technical recruiter who sources candidates across multiple job platforms.",
      "Given a Job Description, extract the role's must-have skills and craft ONE search query per requested source.",
      "Tailor each query to how that platform is actually searched:",
      "- LINKEDIN: a Google-style query targeting public profiles, e.g. site:linkedin.com/in \"AI Engineer\" LangChain Bangkok (these are reached via web search, not a logged-in scrape).",
      "- JOBSDB/JOBTHAI: short Thai/English keyword phrases a job board would match.",
      "- FACEBOOK: a Google-style query for public posts/profiles, e.g. site:facebook.com AI engineer สมัครงาน.",
      "- WEB: a Google-style query, prefer site: filters (github.com, personal sites) or distinctive skill phrases.",
      "Keep queries realistic and specific — not generic. Explain each query's rationale briefly.",
    ].join("\n"),
    user: `Requested sources: ${sourceList}\n\nJob Description:\n"""${jdText}"""`,
    toolName: "submit_query_plan",
    toolDescription: "Submit the extracted role summary, must-have skills, and one tailored search query per source.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["roleSummary", "mustHaveSkills", "queries"],
      properties: {
        roleSummary: { type: "string", description: "1-2 sentence summary of the role" },
        mustHaveSkills: { type: "array", items: { type: "string" } },
        queries: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["source", "query", "rationale"],
            properties: {
              source: { type: "string", enum: sources },
              query: { type: "string" },
              rationale: { type: "string" },
            },
          },
        },
      },
    },
    validate: QueryPlanSchema,
    model: CONTENT_MODEL, // drafting search queries doesn't need Opus
  });
}

/**
 * AI step 2 — normalize the scraper's raw findings and rank them against the JD.
 * Produces a shortlist with an explicit fit score + reasons + concerns, so HR reviews
 * a reasoned recommendation (human-in-the-loop) rather than raw scraped noise.
 */
export async function rankCandidates(
  jdText: string,
  raw: RawCandidate[],
): Promise<RankResult> {
  return structured<RankResult>({
    system: [
      "You are screening sourced candidates for a specific role.",
      "You receive raw, messy candidate snippets scraped from job platforms.",
      "Normalize each into a clean record, then rank by fit against the Job Description.",
      "fitScore is 0-100 overall fit. Give concrete reasons grounded in the snippet — never invent experience.",
      "List concerns/gaps honestly so HR knows what to verify on a call.",
      "Drop entries that are clearly irrelevant or too sparse to assess. Order shortlist best-first.",
    ].join("\n"),
    user: `Job Description:\n"""${jdText}"""\n\nRaw candidates (JSON):\n${JSON.stringify(raw, null, 2)}`,
    toolName: "submit_shortlist",
    toolDescription: "Submit the normalized, ranked shortlist of candidates.",
    maxTokens: 8000,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["shortlist"],
      properties: {
        shortlist: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "headline", "source", "sourceUrl", "email", "fitScore", "reasons", "concerns"],
            properties: {
              name: { type: "string" },
              headline: { type: "string" },
              source: { type: "string", enum: ["LINKEDIN", "JOBSDB", "JOBBKK", "JOBTHAI", "FACEBOOK", "WEB", "REFERRAL", "MANUAL"] },
              sourceUrl: { type: ["string", "null"] },
              email: { type: ["string", "null"] },
              fitScore: { type: "integer", minimum: 0, maximum: 100 },
              reasons: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    validate: RankResultSchema,
  });
}
