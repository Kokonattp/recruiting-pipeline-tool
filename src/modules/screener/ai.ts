import { structured, CLAUDE_MODEL } from "@/lib/claude";
import { ScreeningSchema, SCREENING_TOOL_SCHEMA, type Screening } from "./types";

/**
 * Screen a CV against a Job Description. Returns a structured 3-axis assessment.
 *
 * Prompt design (see AI_LOG.md for iterations):
 * - Score each axis independently with an explicit rubric, so the model doesn't
 *   collapse everything into one vibe score.
 * - Reasoning must cite evidence from the CV — guards against inflated scores.
 * - prescreenQuestions target *gaps*, which is what the recruiter actually needs
 *   on the first call — not generic "tell me about yourself" filler.
 */
export async function screenResume(
  jdText: string,
  cvText: string,
): Promise<{ screening: Screening; model: string }> {
  const screening = await structured<Screening>({
    system: [
      "You are an experienced technical recruiter screening a CV against a specific role.",
      "Score three axes 0-10, each INDEPENDENTLY against this rubric:",
      "- skillsFit: do the candidate's hard skills/tools match the JD's must-haves? 8-10 strong overlap, 5-7 partial, 0-4 weak.",
      "- expFit: seniority, years, and domain relevance vs what the JD asks. Judge depth, not just title.",
      "- cultureFit: communication clarity and collaboration signals inferable from the CV. Be conservative — say so when evidence is thin.",
      "Ground every reasoning sentence in concrete evidence from the CV. Never invent experience the CV doesn't show.",
      "strengths: specific things worth highlighting to the panel. prescreenQuestions: target the GAPS/risks a recruiter should probe on the first call (not generic questions).",
      "summary: 2-3 sentences a busy HR + hiring manager can read before the interview.",
    ].join("\n"),
    user: `JOB DESCRIPTION:\n"""${jdText}"""\n\nCANDIDATE CV:\n"""${cvText}"""`,
    toolName: "submit_screening",
    toolDescription: "Submit the structured 3-axis screening assessment for this candidate.",
    inputSchema: SCREENING_TOOL_SCHEMA as unknown as Record<string, unknown>,
    validate: ScreeningSchema,
  });

  return { screening, model: CLAUDE_MODEL };
}
