import { structured, pdfBlock, textBlock, SCREENING_MODEL } from "@/lib/claude";
import {
  ScreeningSchema,
  SCREENING_TOOL_SCHEMA,
  deriveRecommendation,
  type Screening,
  type Recommendation,
} from "./types";

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
  cv: { text: string } | { pdfBase64: string },
): Promise<{ screening: Screening; recommendation: Recommendation; model: string }> {
  // CV arrives as pasted text or an uploaded PDF (read natively by Claude).
  const user =
    "text" in cv
      ? `JOB DESCRIPTION:\n"""${jdText}"""\n\nCANDIDATE CV:\n"""${cv.text}"""`
      : [
          textBlock(`JOB DESCRIPTION:\n"""${jdText}"""\n\nThe candidate's CV is the attached PDF.`),
          pdfBlock(cv.pdfBase64),
        ];

  const screening = await structured<Screening>({
    system: [
      "You are an experienced technical recruiter screening a CV against a specific role.",
      "Score three axes 0-10 INDEPENDENTLY. Use this ANCHORED rubric — pick the band the",
      "evidence clearly supports; do not split hairs between adjacent numbers based on vibe:",
      "",
      "skillsFit (hard skills/tools vs the JD's must-haves):",
      "  9-10 = has nearly all must-haves with demonstrated depth (projects/work, not just a list).",
      "  7-8  = most must-haves present, some only listed not demonstrated.",
      "  5-6  = about half the must-haves; notable gaps.",
      "  3-4  = few must-haves; mostly adjacent skills.",
      "  0-2  = essentially unrelated skill set.",
      "expFit (seniority, years, domain — judge DEPTH, not title):",
      "  9-10 = years + scope clearly meet/exceed the JD; led or owned comparable work.",
      "  7-8  = meets the JD's level; relevant domain.",
      "  5-6  = slightly junior, or adjacent domain; would ramp.",
      "  3-4  = well below the asked level, or unrelated domain.",
      "  0-2  = no relevant experience.",
      "cultureFit (collaboration/communication signals INFERABLE from the CV):",
      "  Be conservative. A CV shows little culture signal directly.",
      "  7-10 = explicit evidence (mentorship, cross-team, clear writing, OSS/community).",
      "  4-6  = ordinary signals, nothing strong either way (the common case).",
      "  0-3  = red flags or no signal at all. If you can't tell, score 4-5 and set confidence LOW.",
      "",
      "SUB-ATTRIBUTES — each axis also breaks down into 3 named sub-attributes, scored 0-10",
      "on their OWN evidence, independently of the axis total above (they explain the axis",
      "score, they do not derive it — do not force them to average out to the axis number):",
      "- skills sub-attributes: pick the 3 MOST IMPORTANT must-have skills/tools from THIS JD",
      "  specifically (e.g. for a data role: 'SQL/Data Tools', 'Python/Programming', 'Cloud/Infra';",
      "  for an AI/automation role: 'LLM/RAG Orchestration', 'Python/Automation', 'Event-driven Integration').",
      "  Apply the SAME anchored logic as skillsFit: 9-10 demonstrated depth, 5-6 listed not demonstrated, 0-2 absent.",
      "- experience sub-attributes: ALWAYS exactly these 3 labels, in this order —",
      "  'Seniority/Scope' (does the level/scope of past roles match the JD's ask),",
      "  'Domain Match' (same or adjacent industry/domain as the JD),",
      "  'Track Record' (concrete, quantified outcomes vs vague duties).",
      "- culture sub-attributes: ALWAYS exactly these 3 labels, in this order —",
      "  'Collaboration' (cross-team evidence), 'Communication' (clarity/quantification in how the CV is written),",
      "  'Leadership/Mentorship' (explicit evidence only — default low/absent if the CV shows none, don't guess).",
      "",
      "RULES (these prevent the score from drifting between runs):",
      "- Ground EVERY reasoning sentence in concrete evidence quoted/paraphrased from the CV.",
      "- NEVER invent experience the CV doesn't show. Absence of evidence lowers the score, not raises it.",
      "- confidence = HIGH only if the CV is detailed enough to judge all three axes; LOW if it's thin,",
      "  vague, or in a format that hides detail. A low-confidence high score is worse than an honest 'unsure'.",
      "- strengths: specific things to highlight. prescreenQuestions: probe the GAPS/risks you found",
      "  (not generic 'tell me about yourself'). summary: 2-3 sentences for a busy HR + hiring manager.",
    ].join("\n"),
    user,
    toolName: "submit_screening",
    toolDescription: "Submit the structured 3-axis screening assessment for this candidate.",
    inputSchema: SCREENING_TOOL_SCHEMA as unknown as Record<string, unknown>,
    validate: ScreeningSchema,
    model: SCREENING_MODEL, // Sonnet 4.6 — judgment task; sharper than Haiku, cheaper than Opus
    temperature: 0, // deterministic: same CV → same score, not a dice roll (see types.ts)
  });

  // Band is OUR fixed rule on top of the (deterministic) scores — not a second LLM guess.
  const recommendation = deriveRecommendation(screening, screening.confidence);
  return { screening, recommendation, model: SCREENING_MODEL };
}
