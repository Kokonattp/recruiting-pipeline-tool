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
  const skills = jd.requiredSkills.slice(0, 6).join(", ");
  return [
    "A premium, modern tech recruitment poster, vertical A4 orientation.",
    "Dark charcoal-black background with subtle warm golden-amber accent lighting and a faint glow.",
    'Large bold headline at the top reading "WE\'RE HIRING" in clean sans-serif, white with gold accent.',
    `Below it, the job title "${jd.title}"${jd.seniority ? ` (${jd.seniority})` : ""} in a smaller elegant font.`,
    "Right side: a cinematic shot of a software engineer working at a desk with glowing dashboards and workflow diagrams on screens, shallow depth of field.",
    "A clean abstract automation/workflow node diagram (connected nodes, AI brain icon, arrows) as a subtle graphic motif.",
    skills ? `Visual tech motifs hinting at: ${skills}.` : "",
    "Professional, high-end corporate design, generous spacing, sharp, photorealistic + UI overlay blend.",
    "Minimal text — do NOT fill the poster with paragraphs of body text.",
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
