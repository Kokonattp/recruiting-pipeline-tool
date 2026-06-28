"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJD, type GeneratedJD } from "./ai";

/**
 * JD actions: generate a JD from keywords (Claude), and save it as a job_description.
 * Generation and saving are separate so HR can review/edit before committing.
 */

export type GenResult =
  | { ok: true; jd: GeneratedJD }
  | { ok: false; error: string };

const GenInput = z.object({ keywords: z.string().min(5, "ใส่คีย์เวิร์ดอย่างน้อย 5 ตัวอักษร") });

export async function generateJobDescription(input: { keywords: string }): Promise<GenResult> {
  const parsed = GenInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const jd = await generateJD(parsed.data);
    return { ok: true, jd };
  } catch (e) {
    if (e instanceof Error && e.message.includes("ANTHROPIC_API_KEY")) {
      return { ok: false, error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "สร้าง JD ไม่สำเร็จ" };
  }
}

export type SaveResult = { ok: true; jobId: string } | { ok: false; error: string };

/** Persist a (possibly HR-edited) JD as a job_description row. */
export async function saveJobDescription(jd: GeneratedJD): Promise<SaveResult> {
  const { data, error } = await supabaseAdmin()
    .from("job_descriptions")
    .insert({
      title: jd.title,
      department: jd.department,
      seniority: jd.seniority,
      raw_text: jd.rawText,
      required_skills: jd.requiredSkills,
      nice_to_have: jd.niceToHave,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "บันทึก JD ไม่สำเร็จ" };
  revalidatePath("/scraper");
  return { ok: true, jobId: (data as { id: string }).id };
}
