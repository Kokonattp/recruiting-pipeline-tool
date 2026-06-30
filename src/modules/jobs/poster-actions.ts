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
    "Ultra high-resolution premium tech recruitment poster. Vertical A4 portrait (2:3). Sharp crisp edges, zero blur on UI elements, 8K detail level.",
    "Background: deep charcoal black (#0e0e0e). Single accent color: warm gold (#f5c842) — used for glow, rim light, thin rule lines, and job title only. No other colors.",
    "LAYOUT TOP (30%): Stark white ultra-bold condensed sans-serif 'WE'RE HIRING' — massive, dominant. Directly below: gold text '" + titleLine + "' in a refined lighter weight. Nothing else in this zone.",
    "LAYOUT CENTER (50%): Photorealistic cinematic scene — lone developer silhouetted at a curved ultrawide monitor setup in a dark room. Screens glow with node-graph workflow diagrams and dashboard data. Dramatic golden rim light from the right. Shallow DOF bokeh background. High contrast, film-grade color grading.",
    skills ? `Holographic icon overlays floating near the screens — abstract symbols for: ${skills}. Icons only, no text labels.` : "",
    "LAYOUT BOTTOM (20%): Single thin horizontal gold (#f5c842) rule. Small 'H+' logomark in gold bottom-center. Absolute silence — no text, no bullets, no body copy.",
    "Quality directives: razor-sharp typography, no font artifacts, no lorem ipsum, no extra words. Cinematic depth. Agency-grade composition. Think Cyberpunk × Apple keynote × Wired magazine cover.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateJobPoster(jd: GeneratedJD): Promise<PosterResult> {
  const parsed = PosterInput.safeParse(jd);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    const { base64 } = await generatePosterImage(buildPrompt(parsed.data), "1024x1792");
    return { ok: true, base64 };
  } catch (e) {
    if (e instanceof Error && e.message.includes("OPENAI_API_KEY")) {
      return { ok: false, error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน .env.local" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "สร้างรูปไม่สำเร็จ" };
  }
}
