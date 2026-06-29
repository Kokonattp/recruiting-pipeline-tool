import { z } from "zod";
import { structured, CONTENT_MODEL } from "@/lib/claude";

/**
 * JD Generator (Module 1, step 1). HR types a few keywords (title, skills, years);
 * Claude expands them into a complete, well-structured Job Description plus parsed
 * skill lists — which then drive search-query generation and screening downstream.
 */

export const GeneratedJDSchema = z.object({
  title: z.string(),
  department: z.string(),
  seniority: z.string(),
  summary: z.string(),
  responsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  niceToHave: z.array(z.string()),
  /** full formatted JD text (summary + responsibilities + requirements) for storage/display */
  rawText: z.string(),
});
export type GeneratedJD = z.infer<typeof GeneratedJDSchema>;

export async function generateJD(input: {
  keywords: string;
}): Promise<GeneratedJD> {
  return structured<GeneratedJD>({
    system: [
      "You are an experienced technical recruiter writing job descriptions.",
      "Given a few keywords from HR (role, skills, years, industry, location), expand them",
      "into a complete, professional Job Description.",
      "Write naturally in the language the keywords are in (Thai or English).",
      "Be concrete and realistic — no filler. requiredSkills are must-haves, niceToHave are bonuses.",
      "rawText should be the full JD as HR would post it (summary + responsibilities + requirements sections).",
    ].join("\n"),
    user: `Keywords from HR:\n"""${input.keywords}"""`,
    toolName: "submit_job_description",
    toolDescription: "Submit the fully expanded job description.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "department", "seniority", "summary", "responsibilities", "requiredSkills", "niceToHave", "rawText"],
      properties: {
        title: { type: "string" },
        department: { type: "string" },
        seniority: { type: "string", description: "e.g. Junior / Mid / Senior / Lead" },
        summary: { type: "string", description: "1-2 paragraph role summary" },
        responsibilities: { type: "array", items: { type: "string" } },
        requiredSkills: { type: "array", items: { type: "string" } },
        niceToHave: { type: "array", items: { type: "string" } },
        rawText: { type: "string", description: "full formatted JD text" },
      },
    },
    validate: GeneratedJDSchema,
    model: CONTENT_MODEL, // writing a JD doesn't need Opus
  });
}
