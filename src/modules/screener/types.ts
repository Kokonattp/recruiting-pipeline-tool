import { z } from "zod";

/**
 * Contract for Module 2 (Resume Screener). The AI returns a 3-axis fit assessment
 * with reasoning, strengths to highlight, and questions to ask on the prescreen call.
 * Mirrors the `screening_results` table so the result persists 1:1.
 */
/**
 * Recommendation band instead of a single pass/fail number. A widely-reported failure
 * of LLM résumé scoring (e.g. HackerRank's open ATS) is that the same CV scores 66–99
 * across runs, so a hard cutoff passes or fails a candidate at random. We score
 * deterministically (temperature 0) AND surface a band + a confidence signal so HR
 * treats the number as a sort key, not an automatic gate.
 */
export const RecommendationSchema = z.enum(["STRONG", "CONSIDER", "WEAK"]);
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const ScreeningSchema = z.object({
  skillsFit: z.number().int().min(0).max(10),
  expFit: z.number().int().min(0).max(10),
  cultureFit: z.number().int().min(0).max(10),
  reasoning: z.object({
    skills: z.string(),
    experience: z.string(),
    culture: z.string(),
  }),
  /** How well the CV supported a confident judgment (thin CVs => LOW, say so openly). */
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  recommendation: RecommendationSchema,
  strengths: z.array(z.string()),
  prescreenQuestions: z.array(z.string()),
  summary: z.string(), // for the HR + hiring-manager panel
});
export type Screening = z.infer<typeof ScreeningSchema>;

/** JSON-schema fed to Claude's tool — kept beside the zod schema so they evolve together. */
export const SCREENING_TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["skillsFit", "expFit", "cultureFit", "reasoning", "confidence", "recommendation", "strengths", "prescreenQuestions", "summary"],
  properties: {
    skillsFit: { type: "integer", minimum: 0, maximum: 10, description: "Hard-skill match vs JD" },
    expFit: { type: "integer", minimum: 0, maximum: 10, description: "Seniority / years / domain match" },
    cultureFit: { type: "integer", minimum: 0, maximum: 10, description: "Communication & culture signals" },
    reasoning: {
      type: "object",
      additionalProperties: false,
      required: ["skills", "experience", "culture"],
      properties: {
        skills: { type: "string" },
        experience: { type: "string" },
        culture: { type: "string" },
      },
    },
    confidence: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"],
      description: "How well the CV supported a confident judgment. LOW when the CV is thin/ambiguous.",
    },
    recommendation: {
      type: "string",
      enum: ["STRONG", "CONSIDER", "WEAK"],
      description: "Overall band — a sort hint, NOT an automatic gate. STRONG=clear interview, CONSIDER=needs a human look, WEAK=likely not a fit.",
    },
    strengths: { type: "array", items: { type: "string" }, description: "Concrete strengths to highlight" },
    prescreenQuestions: { type: "array", items: { type: "string" }, description: "Gaps to probe on the prescreen call" },
    summary: { type: "string", description: "2-3 sentence summary for the interview panel" },
  },
} as const;
