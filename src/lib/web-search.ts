import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CLAUDE_MODEL } from "./claude";

/**
 * Candidate sourcing via Claude's built-in web_search tool.
 *
 * Unlike the Playwright scraper (which opens specific job sites), this lets Claude
 * search the open web and read result snippets itself, then hand back candidates.
 * It runs entirely inside the API call — no separate service to deploy — so it works
 * on Vercel even when the scraper service isn't up.
 *
 * Anti-hallucination guard: every returned candidate MUST carry a real sourceUrl that
 * came from the search results. We drop any without one. The model is told never to
 * invent people. HR still reviews + approves (human-in-the-loop) before anything is saved.
 */

const FoundCandidate = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  sourceUrl: z.string().url(),
  snippet: z.string().optional(),
});
export type WebSearchCandidate = z.infer<typeof FoundCandidate>;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY. Add it to .env.local.");
  }
  return (_client ??= new Anthropic());
}

const SUBMIT_TOOL = {
  name: "submit_candidates",
  description: "Submit the candidates found in the web search results.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["sourceUrl"],
          properties: {
            name: { type: "string", description: "Person's name if identifiable, else omit" },
            headline: { type: "string", description: "Role/title or one-line summary" },
            sourceUrl: { type: "string", description: "The REAL result URL this came from" },
            snippet: { type: "string", description: "Short evidence text from the result" },
          },
        },
      },
    },
  },
} as const;

/**
 * @param siteHints  optional site: filters to steer the search, e.g.
 *   ["linkedin.com/in", "facebook.com"]. This is how we reach LinkedIn/Facebook
 *   *legitimately*: we don't scrape their site (ToS/login), we ask web search for their
 *   PUBLIC, already-Google-indexed profile pages — same as a person typing the query.
 */
export async function webSearchCandidates(
  jdText: string,
  siteHints: string[] = [],
  searchQuery?: string, // pre-built query from AI query plan; falls back to deriving from JD
): Promise<WebSearchCandidate[]> {
  const siteLine =
    siteHints.length > 0
      ? `Prioritize results from these sites using site: filters — ${siteHints
          .map((s) => `site:${s}`)
          .join(", ")}. Also search the open web for portfolios/GitHub.`
      : "";

  const queryHint = searchQuery
    ? `Use this pre-built search query as your first search (already tailored to the role): "${searchQuery}"`
    : "";

  const response = await client().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: [
      "You are a technical sourcer. Use web search to find real, public candidate profiles.",
      "Search ONLY in English — even if the job description is in Thai, translate skills/role to English for searching.",
      "Target: LinkedIn public profiles, GitHub profiles, personal portfolios, public résumés, job-board profiles.",
      "Prefer specific people over job listings or articles.",
      siteLine,
      queryHint,
      "CRITICAL: never invent a person. Only submit candidates that appear in actual search results,",
      "each with the real result URL. If a result is a company/listing rather than a person, still",
      "include it with its URL and a clear headline.",
      "Run exactly 2 focused searches only. Stop immediately after you have 8+ candidates.",
      "Submit at most 10 results — quality over quantity.",
    ].filter(Boolean).join("\n"),
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 2 } as Anthropic.Messages.ToolUnion,
      SUBMIT_TOOL as unknown as Anthropic.Messages.Tool,
    ],
    messages: [
      {
        role: "user",
        content: `Find candidates matching this job description. Search the web, then call submit_candidates.\n\nJOB DESCRIPTION:\n"""${jdText}"""`,
      },
    ],
  });

  const submit = response.content.find(
    (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use" && b.name === "submit_candidates",
  );
  if (!submit) return [];

  const parsed = z.object({ candidates: z.array(FoundCandidate) }).safeParse(submit.input);
  if (!parsed.success) return [];

  // De-dupe by URL; drop anything without a usable http(s) URL (anti-hallucination).
  const seen = new Set<string>();
  return parsed.data.candidates.filter((c) => {
    if (!/^https?:\/\//.test(c.sourceUrl) || seen.has(c.sourceUrl)) return false;
    seen.add(c.sourceUrl);
    return true;
  }).slice(0, 10);
}
