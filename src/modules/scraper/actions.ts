"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { SOURCES, type Source } from "@/lib/types";
import { planQueries, rankCandidates } from "./ai";
import type { QueryPlan, RankResult, RawCandidate } from "./types";

/**
 * Server Actions driving the sourcing flow. They orchestrate AI + the scraper service;
 * Supabase persistence is wired in the linking phase (marked TODO). Each action validates
 * its input with zod before doing anything.
 */

const PlanInput = z.object({
  jdText: z.string().min(20, "วาง Job Description อย่างน้อย 20 ตัวอักษร"),
  sources: z.array(z.enum(SOURCES as [Source, ...Source[]])).min(1, "เลือกอย่างน้อย 1 แหล่ง"),
});

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Step 1: JD → AI search-query plan (one query per source). */
export async function generateQueryPlan(input: {
  jdText: string;
  sources: Source[];
}): Promise<ActionResult<QueryPlan>> {
  const parsed = PlanInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  try {
    const plan = await planQueries(parsed.data.jdText, parsed.data.sources);
    return { ok: true, data: plan };
  } catch (e) {
    return { ok: false, error: aiError(e) };
  }
}

/**
 * Step 2: trigger the external scraper service with the plan, then rank what it returns.
 * The scraper runs Playwright in a separate Docker service (env SCRAPER_SERVICE_URL).
 */
export async function runScrapeAndRank(input: {
  jdText: string;
  plan: QueryPlan;
}): Promise<ActionResult<RankResult>> {
  const serviceUrl = process.env.SCRAPER_SERVICE_URL;
  if (!serviceUrl) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า SCRAPER_SERVICE_URL (scraper service)" };
  }
  try {
    const res = await fetch(`${serviceUrl}/scrape`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: process.env.SCRAPER_INGEST_SECRET,
        queries: input.plan.queries,
      }),
    });
    if (!res.ok) return { ok: false, error: `scraper service error (${res.status})` };
    const raw = (await res.json()) as { candidates: RawCandidate[] };

    const ranked = await rankCandidates(input.jdText, raw.candidates);
    return { ok: true, data: ranked };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "เรียก scraper ไม่สำเร็จ" };
  }
}

/**
 * Step 3: HR approves selected candidates → persist into candidates (APPROVED) +
 * applications (stage APPLIED) for the given job. This is the human-in-the-loop gate:
 * nothing enters the Tracker until HR reviews and approves.
 */
export async function approveCandidates(input: {
  jobId: string;
  selected: RankResult["shortlist"];
}): Promise<ActionResult<{ inserted: number }>> {
  if (!input.jobId) return { ok: false, error: "ไม่พบตำแหน่งงาน (jobId)" };
  if (input.selected.length === 0) return { ok: false, error: "ยังไม่ได้เลือกผู้สมัคร" };

  const db = supabaseAdmin();
  let inserted = 0;

  for (const c of input.selected) {
    const { data: cand, error: e1 } = await db
      .from("candidates")
      .insert({
        name: c.name,
        email: c.email,
        source: c.source,
        source_url: c.sourceUrl,
        headline: c.headline,
        normalized: { fitScore: c.fitScore, reasons: c.reasons, concerns: c.concerns },
        review_status: "APPROVED",
      })
      .select("id")
      .single();
    if (e1 || !cand) return { ok: false, error: e1?.message ?? "insert candidate ล้มเหลว" };

    const { error: e2 } = await db
      .from("applications")
      .insert({ candidate_id: (cand as { id: string }).id, job_id: input.jobId, stage: "APPLIED" });
    if (e2) return { ok: false, error: e2.message };
    inserted++;
  }

  revalidatePath("/tracker");
  return { ok: true, data: { inserted } };
}

function aiError(e: unknown): string {
  if (e instanceof Error && e.message.includes("ANTHROPIC_API_KEY")) {
    return "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY";
  }
  return e instanceof Error ? e.message : "AI ทำงานผิดพลาด";
}
