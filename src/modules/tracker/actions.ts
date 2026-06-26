"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { SOURCES, STAGES, type Source, type Stage } from "@/lib/types";

/**
 * Tracker mutations. Every action validates with zod, writes via the service-role
 * client, and revalidates /tracker so the board reflects the change. Errors are
 * returned (not thrown) so the UI can show them inline.
 */

export type Result = { ok: true } | { ok: false; error: string };

const AddInput = z.object({
  name: z.string().min(1, "กรอกชื่อผู้สมัคร"),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.enum(SOURCES as [Source, ...Source[]]),
  jobId: z.string().min(1, "เลือกตำแหน่ง"),
});

/** Create a candidate + an application (stage APPLIED) for the given job. */
export async function addCandidate(input: z.input<typeof AddInput>): Promise<Result> {
  const parsed = AddInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, email, phone, source, jobId } = parsed.data;

  const db = supabaseAdmin();
  const { data: cand, error: e1 } = await db
    .from("candidates")
    .insert({ name, email: email || null, phone: phone || null, source, review_status: "APPROVED" })
    .select("id")
    .single();
  if (e1 || !cand) return { ok: false, error: e1?.message ?? "สร้าง candidate ไม่สำเร็จ" };

  const { error: e2 } = await db
    .from("applications")
    .insert({ candidate_id: (cand as { id: string }).id, job_id: jobId, stage: "APPLIED" });
  if (e2) return { ok: false, error: e2.message };

  revalidatePath("/tracker");
  return { ok: true };
}

const StageInput = z.object({
  applicationId: z.string().min(1),
  stage: z.enum(STAGES as [Stage, ...Stage[]]),
});

/** Move an application to a new pipeline stage (called after a drag-and-drop). */
export async function updateStage(input: z.input<typeof StageInput>): Promise<Result> {
  const parsed = StageInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { error } = await supabaseAdmin()
    .from("applications")
    .update({ stage: parsed.data.stage })
    .eq("id", parsed.data.applicationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tracker");
  return { ok: true };
}

/** Delete a candidate (cascades to their applications via the FK). */
export async function deleteCandidate(candidateId: string): Promise<Result> {
  const { error } = await supabaseAdmin().from("candidates").delete().eq("id", candidateId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/tracker");
  return { ok: true };
}
