"use server";

import { z } from "zod";
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
 * Step 3: HR approves selected candidates → persist into candidates + applications
 * (review_status APPROVED, stage APPLIED). This is the human-in-the-loop gate.
 */
export async function approveCandidates(_input: {
  jobId: string;
  selected: RankResult["shortlist"];
}): Promise<ActionResult<{ inserted: number }>> {
  // TODO(linking phase): supabaseAdmin().from("candidates").insert(...) + applications insert.
  return { ok: false, error: "ยังไม่ได้เชื่อม Supabase — จะ persist ได้หลังลิงก์ DB" };
}

function aiError(e: unknown): string {
  if (e instanceof Error && e.message.includes("ANTHROPIC_API_KEY")) {
    return "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY";
  }
  return e instanceof Error ? e.message : "AI ทำงานผิดพลาด";
}
