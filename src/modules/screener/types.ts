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

/**
 * Derive the band from the (deterministic) axis scores + confidence — OUR rule, not the
 * model's guess. The model only scores the three axes; turning that into a band is fixed
 * logic so the same scores always map to the same band (no second layer of LLM variance).
 *
 * Total = skills + exp + culture (max 30). Low confidence never auto-rejects: it routes
 * to CONSIDER so a human looks, which is the whole point of keeping people in the loop.
 */
export function deriveRecommendation(
  scores: { skillsFit: number; expFit: number; cultureFit: number },
  confidence: "HIGH" | "MEDIUM" | "LOW",
): Recommendation {
  const total = scores.skillsFit + scores.expFit + scores.cultureFit; // 0-30
  if (confidence === "LOW") return "CONSIDER"; // unsure → human decides, regardless of total
  if (total >= 22) return "STRONG"; // ~73%+
  if (total >= 14) return "CONSIDER";
  return "WEAK";
}

/** One named sub-attribute under an axis (e.g. "SQL/Data Tools": 8/10) — an FM-style
 *  attribute breakdown explaining WHY the axis landed where it did, not a second
 *  scoring layer: the axis score is independent and does not derive from these. */
const SubAttributeSchema = z.object({
  label: z.string(),
  score: z.number().int().min(0).max(10),
});
export type SubAttribute = z.infer<typeof SubAttributeSchema>;

export const ScreeningSchema = z.object({
  skillsFit: z.number().int().min(0).max(10),
  expFit: z.number().int().min(0).max(10),
  cultureFit: z.number().int().min(0).max(10),
  reasoning: z.object({
    skills: z.string(),
    experience: z.string(),
    culture: z.string(),
  }),
  /** 3 sub-attributes per axis, scored independently of the axis total. Skills labels are
   *  drawn from the JD's own must-haves (varies per role); exp/culture labels are fixed
   *  so HR sees the same breakdown shape across every candidate for a given axis. */
  subAttributes: z.object({
    skills: z.array(SubAttributeSchema).length(3),
    experience: z.array(SubAttributeSchema).length(3),
    culture: z.array(SubAttributeSchema).length(3),
  }),
  /** How well the CV supported a confident judgment (thin CVs => LOW, say so openly). */
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  strengths: z.array(z.string()),
  prescreenQuestions: z.array(z.string()),
  summary: z.string(), // for the HR + hiring-manager panel
});
export type Screening = z.infer<typeof ScreeningSchema>;

const SUB_ATTRIBUTE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["label", "score"],
  properties: {
    label: { type: "string" },
    score: { type: "integer" },
  },
} as const;

/** JSON-schema fed to Claude's tool — kept beside the zod schema so they evolve together. */
export const SCREENING_TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["skillsFit", "expFit", "cultureFit", "reasoning", "subAttributes", "confidence", "strengths", "prescreenQuestions", "summary"],
  properties: {
    skillsFit: { type: "integer", description: "Hard-skill match vs JD 0-10" },
    expFit: { type: "integer", description: "Seniority / years / domain match 0-10" },
    cultureFit: { type: "integer", description: "Communication & culture signals 0-10" },
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
    subAttributes: {
      type: "object",
      additionalProperties: false,
      required: ["skills", "experience", "culture"],
      description: "3 named sub-attributes per axis (0-10 each), scored independently of the axis total — explains what's behind the number.",
      properties: {
        skills: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: SUB_ATTRIBUTE_JSON_SCHEMA,
          description: "3 of the JD's own must-have skills/tools, each scored on evidence in the CV.",
        },
        experience: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: SUB_ATTRIBUTE_JSON_SCHEMA,
          description: "Fixed labels: Seniority/Scope, Domain Match, Track Record.",
        },
        culture: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: SUB_ATTRIBUTE_JSON_SCHEMA,
          description: "Fixed labels: Collaboration, Communication, Leadership/Mentorship.",
        },
      },
    },
    confidence: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"],
      description: "How well the CV supported a confident judgment. LOW when the CV is thin/ambiguous.",
    },
    strengths: { type: "array", items: { type: "string" }, description: "Concrete strengths to highlight" },
    prescreenQuestions: { type: "array", items: { type: "string" }, description: "Gaps to probe on the prescreen call" },
    summary: { type: "string", description: "2-3 sentence summary for the interview panel" },
  },
} as const;
