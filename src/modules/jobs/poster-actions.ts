"use server";

import { z } from "zod";
import { generatePosterImage } from "@/lib/openai";
import type { GeneratedJD } from "./ai";

/**
 * Generate a "We're hiring" poster image from a JD via OpenAI gpt-image-1.
 * The JD is summarized into an art-direction prompt (dark, premium, gold accent —
 * matching a modern tech-recruiting poster). Returns a base64 PNG the client renders
 * and lets HR download. Text inside AI images is unreliable (esp. Thai), so the prompt
 * keeps on-image text minimal and English; the saved JD remains the source of truth.
 */

const PosterInput = z.object({
  title: z.string().min(1),
  department: z.string().optional().default(""),
  seniority: z.string().optional().default(""),
  requiredSkills: z.array(z.string()).default([]),
});

export type PosterResult =
  | { ok: true; base64: string }
  | { ok: false; error: string };

function buildPrompt(jd: z.infer<typeof PosterInput>): string {
  const skills = jd.requiredSkills.slice(0, 5).join(", ");
  const titleLine = `${jd.seniority ? jd.seniority + " " : ""}${jd.title}`.toUpperCase();
  return [
    "A premium, cinematic tech recruitment poster. Vertical A4 portrait format (2:3 ratio).",
    "Deep charcoal-black (#0e0e0e) background. Warm golden-amber (#f5c842) as the ONLY accent color — glowing rim light, subtle radial gradient, thin gold rule lines.",
    "TOP SECTION: Large ultra-bold white sans-serif text 'WE'RE HIRING' — this is the dominant headline. Below it, gold-colored job title text: '" + titleLine + "'. No other text blocks anywhere.",
    "CENTER SECTION: Cinematic photo-real image of a developer at a dark workstation — multiple glowing monitors showing data dashboards and workflow node graphs, shallow depth of field bokeh, dramatic side lighting.",
    skills ? `Subtle floating UI fragments hinting at: ${skills} — as glowing icon overlays, not text labels.` : "",
    "BOTTOM SECTION: Minimal — just a thin gold horizontal rule and small placeholder logo area. NO bullet points, NO paragraphs, NO body copy.",
    "Overall: high-end agency quality, heavy contrast, dramatic lighting, editorial feel. Think Apple × Cyberpunk × Corporate annual report.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateJobPoster(jd: GeneratedJD): Promise<PosterResult> {
  const parsed = PosterInput.safeParse(jd);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    const { base64 } = await generatePosterImage(buildPrompt(parsed.data), "1024x1536");
    return { ok: true, base64 };
  } catch (e) {
    if (e instanceof Error && e.message.includes("OPENAI_API_KEY")) {
      return { ok: false, error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน .env.local" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "สร้างรูปไม่สำเร็จ" };
  }
}
