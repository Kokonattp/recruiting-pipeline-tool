"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { extractPdfText } from "@/lib/pdf";
import { screenResume } from "./ai";
import type { Screening, Recommendation } from "./types";

/**
 * Server Action for the Resume Screener.
 *
 * Input is CV text (pasted, or extracted from an uploaded PDF on the client).
 * PDF-by-upload is handled at link time via Claude's native document input, which is
 * more robust than parsing PDFs ourselves. Persisting the result to `screening_results`
 * + linking to an application is wired in the linking phase.
 */

const ScreenInput = z
  .object({
    jdText: z.string().min(20, "เลือกหรือวาง Job Description ก่อน"),
    cvText: z.string().optional(),
    cvPdfBase64: z.string().optional(),
    /** when set, the result is saved against this application */
    applicationId: z.string().optional(),
  })
  .refine(
    (v) => (v.cvText && v.cvText.trim().length >= 40) || !!v.cvPdfBase64,
    { message: "วางข้อความ CV (≥40 ตัวอักษร) หรืออัปโหลด PDF", path: ["cvText"] },
  );

export type ScreenResult =
  | { ok: true; screening: Screening; recommendation: Recommendation; model: string }
  | { ok: false; error: string };

export async function runScreening(input: {
  jdText: string;
  cvText?: string;
  cvPdfBase64?: string;
  applicationId?: string;
}): Promise<ScreenResult> {
  const parsed = ScreenInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  try {
    // Token optimization: if a PDF was uploaded, try to pull its text out server-side
    // first and send only that (cheap). Fall back to Claude's native PDF reading
    // (image+text, pricier but OCR-capable) only when extraction finds no real text —
    // i.e. a scanned/image CV.
    let cv: { text: string } | { pdfBase64: string };
    if (parsed.data.cvPdfBase64) {
      const extracted = await extractPdfText(parsed.data.cvPdfBase64);
      console.log(`[screener] PDF extraction: ${extracted ? `${extracted.length} chars → text mode` : "no text → native PDF mode"}`);
      cv = extracted ? { text: extracted } : { pdfBase64: parsed.data.cvPdfBase64 };
    } else {
      cv = { text: parsed.data.cvText ?? "" };
    }
    const t0 = Date.now();
    const { screening, recommendation, model } = await screenResume(parsed.data.jdText, cv);
    console.log(`[screener] screenResume took ${Date.now() - t0}ms (model: ${model})`);

    // Persist only when tied to an application (upsert: one screening per application).
    if (parsed.data.applicationId) {
      const { error } = await supabaseAdmin()
        .from("screening_results")
        .upsert(
          {
            application_id: parsed.data.applicationId,
            skills_fit: screening.skillsFit,
            exp_fit: screening.expFit,
            culture_fit: screening.cultureFit,
            reasoning: screening.reasoning,
            confidence: screening.confidence,
            recommendation,
            strengths: screening.strengths,
            prescreen_questions: screening.prescreenQuestions,
            summary: screening.summary,
            model,
          },
          { onConflict: "application_id" },
        );
      if (error) return { ok: false, error: error.message };
      revalidatePath("/tracker");
    }

    return { ok: true, screening, recommendation, model };
  } catch (e) {
    if (e instanceof Error && e.message.includes("ANTHROPIC_API_KEY")) {
      return { ok: false, error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "AI ประเมินไม่สำเร็จ" };
  }
}
