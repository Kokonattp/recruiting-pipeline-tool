import { z } from "zod";

/**
 * Contract for Module 2 (Resume Screener). The AI returns a 3-axis fit assessment
 * with reasoning, strengths to highlight, and questions to ask on the prescreen call.
 * Mirrors the `screening_results` table so the result persists 1:1.
 */
export const ScreeningSchema = z.object({
  skillsFit: z.number().int().min(0).max(10),
  expFit: z.number().int().min(0).max(10),
  cultureFit: z.number().int().min(0).max(10),
  reasoning: z.object({
    skills: z.string(),
    experience: z.string(),
    culture: z.string(),
  }),
  strengths: z.array(z.string()),
  prescreenQuestions: z.array(z.string()),
  summary: z.string(), // for the HR + hiring-manager panel
});
export type Screening = z.infer<typeof ScreeningSchema>;

/** JSON-schema fed to Claude's tool — kept beside the zod schema so they evolve together. */
export const SCREENING_TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["skillsFit", "expFit", "cultureFit", "reasoning", "strengths", "prescreenQuestions", "summary"],
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
    strengths: { type: "array", items: { type: "string" }, description: "Concrete strengths to highlight" },
    prescreenQuestions: { type: "array", items: { type: "string" }, description: "Gaps to probe on the prescreen call" },
    summary: { type: "string", description: "2-3 sentence summary for the interview panel" },
  },
} as const;
