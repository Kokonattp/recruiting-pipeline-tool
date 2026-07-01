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
      "- GITHUB: this hits GitHub's REST user-search API directly (not a web search), which only supports the qualifiers language:, location:, repos:, followers:, created: — bare keywords only match a user's login/name/email, NOT their bio or repos. So do NOT stack multiple skill words as free text (e.g. 'dbt Snowflake Airflow Spark' will match almost nobody). Instead pick the ONE dominant programming language the role needs (e.g. language:python or language:go) plus optionally location:<city or country>, and keep it to just those 1-2 qualifiers.",
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
    thinking: "disabled", // bounded drafting task — skip adaptive thinking, it's pure latency here
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
      "Only drop entries that are clearly irrelevant to the role entirely (wrong field, wrong seniority tier).",
      "A sparse snippet (e.g. just a username/repo count with no bio) is NOT a reason to drop — keep it, score it",
      "conservatively, and say plainly in concerns that there isn't enough evidence yet to confirm fit; that's a",
      "valid, honest outcome for HR to see rather than silently disappearing the candidate. Order best-first.",
    ].join("\n"),
    user: `Job Description:\n"""${jdText}"""\n\nRaw candidates (JSON — max 20 shown):\n${JSON.stringify(raw.slice(0, 20), null, 2)}`,
    toolName: "submit_shortlist",
    toolDescription: "Submit the normalized, ranked shortlist of candidates.",
    maxTokens: 4000,
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
              fitScore: { type: "integer" },
              reasons: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    validate: RankResultSchema,
    // Ranking against a fixed rubric doesn't need extended thinking — it's the single
    // biggest latency source in the sourcing flow (Opus + adaptive thinking can run
    // 20-40s on its own, on top of the source fan-out). This model defaults to Opus
    // 4.8, which rejects a `temperature` override outright (sampling params were
    // removed on Opus 4.7+) — disable thinking explicitly instead, which is safe on
    // every model tier.
    thinking: "disabled",
  });
}
