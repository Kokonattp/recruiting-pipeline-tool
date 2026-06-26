"use server";

import { z } from "zod";
import { screenResume } from "./ai";
import type { Screening } from "./types";

/**
 * Server Action for the Resume Screener.
 *
 * Input is CV text (pasted, or extracted from an uploaded PDF on the client).
 * PDF-by-upload is handled at link time via Claude's native document input, which is
 * more robust than parsing PDFs ourselves. Persisting the result to `screening_results`
 * + linking to an application is wired in the linking phase.
 */

const ScreenInput = z.object({
  jdText: z.string().min(20, "เลือกหรือวาง Job Description ก่อน"),
  cvText: z.string().min(40, "วางข้อความ CV อย่างน้อย 40 ตัวอักษร"),
});

export type ScreenResult =
  | { ok: true; screening: Screening; model: string }
  | { ok: false; error: string };

export async function runScreening(input: {
  jdText: string;
  cvText: string;
}): Promise<ScreenResult> {
  const parsed = ScreenInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  try {
    const { screening, model } = await screenResume(parsed.data.jdText, parsed.data.cvText);
    // TODO(linking phase): persist to screening_results + link to application.
    return { ok: true, screening, model };
  } catch (e) {
    if (e instanceof Error && e.message.includes("ANTHROPIC_API_KEY")) {
      return { ok: false, error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "AI ประเมินไม่สำเร็จ" };
  }
}
