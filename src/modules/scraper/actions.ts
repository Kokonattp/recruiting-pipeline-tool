"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { SOURCES, type Source } from "@/lib/types";
import { planQueries, rankCandidates } from "./ai";
import { webSearchCandidates } from "@/lib/web-search";
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

/**
 * Alternative intake: HR uploads a CSV of candidates (e.g. exported from a job board).
 * We parse rows into RawCandidate, then reuse the same AI ranking as scraping — so CSV
 * and scrape converge on one reviewed shortlist. No external service needed (works even
 * when scraping is blocked).
 */
export async function importCsvAndRank(input: {
  jdText: string;
  rows: RawCandidate[];
}): Promise<ActionResult<RankResult>> {
  if (input.rows.length === 0) return { ok: false, error: "ไฟล์ CSV ว่างหรืออ่านไม่ได้" };
  try {
    const ranked = await rankCandidates(input.jdText, input.rows);
    return { ok: true, data: ranked };
  } catch (e) {
    return { ok: false, error: aiError(e) };
  }
}

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
 * One-click sourcing: fan out to every available source in PARALLEL, merge the raw
 * results, then rank once. Sources are independent — the scraper service (Playwright,
 * may be unconfigured/down) and Claude web search (always available with an API key)
 * run together; whichever returns results contributes. A source failing is logged in
 * `sources` and skipped, never failing the whole request. Returns the ranked shortlist
 * plus a per-source tally so HR can see where candidates came from.
 */
export async function runSourcing(input: {
  jdText: string;
  plan: QueryPlan;
}): Promise<ActionResult<{ result: RankResult; sources: { name: string; found: number; ok: boolean }[] }>> {
  const sources: { name: string; found: number; ok: boolean }[] = [];

  // Kick off both intake paths at once.
  const scrapePromise: Promise<RawCandidate[]> = (async () => {
    const serviceUrl = process.env.SCRAPER_SERVICE_URL;
    if (!serviceUrl) throw new Error("scraper not configured");
    const res = await fetch(`${serviceUrl}/scrape`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: process.env.SCRAPER_INGEST_SECRET, queries: input.plan.queries }),
    });
    if (!res.ok) throw new Error(`scraper ${res.status}`);
    return ((await res.json()) as { candidates: RawCandidate[] }).candidates;
  })();

  const webPromise: Promise<RawCandidate[]> = (async () => {
    // LinkedIn/Facebook can't be scraped (ToS/login) — but if HR picked them, steer web
    // search at their PUBLIC indexed profiles via site: filters (legitimate, no login).
    const picked = new Set(input.plan.queries.map((q) => q.source));
    const siteHints: string[] = [];
    if (picked.has("LINKEDIN")) siteHints.push("linkedin.com/in");
    if (picked.has("FACEBOOK")) siteHints.push("facebook.com");
    const found = await webSearchCandidates(input.jdText, siteHints);
    return found.map((c) => ({
      source: "WEB" as const,
      sourceUrl: c.sourceUrl,
      name: c.name,
      headline: c.headline,
      snippet: c.snippet,
    }));
  })();

  const [scrapeRes, webRes] = await Promise.allSettled([scrapePromise, webPromise]);

  const raw: RawCandidate[] = [];
  if (scrapeRes.status === "fulfilled") {
    raw.push(...scrapeRes.value);
    sources.push({ name: "Scraper (เว็บไซต์งาน)", found: scrapeRes.value.length, ok: true });
  } else {
    sources.push({ name: "Scraper (เว็บไซต์งาน)", found: 0, ok: false });
  }
  if (webRes.status === "fulfilled") {
    raw.push(...webRes.value);
    sources.push({ name: "AI Web Search", found: webRes.value.length, ok: true });
  } else {
    sources.push({ name: "AI Web Search", found: 0, ok: false });
  }

  if (raw.length === 0) {
    const why = sources.every((s) => !s.ok)
      ? "ทุกแหล่งค้นไม่สำเร็จ (ตรวจ ANTHROPIC_API_KEY / SCRAPER_SERVICE_URL)"
      : "ไม่พบผู้สมัครจากคำค้นนี้ ลองปรับ JD หรือคำค้น";
    return { ok: false, error: why };
  }

  try {
    const result = await rankCandidates(input.jdText, raw);
    return { ok: true, data: { result, sources } };
  } catch (e) {
    return { ok: false, error: aiError(e) };
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
