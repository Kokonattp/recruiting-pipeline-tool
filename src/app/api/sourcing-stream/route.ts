import { NextRequest } from "next/server";
import { webSearchCandidates } from "@/lib/web-search";
import { githubCandidates, linkedinCandidates, facebookCandidates, jobsdbCandidates, jobthaiCandidates } from "@/lib/sourcing-apis";
import { rankCandidates } from "@/modules/scraper/ai";
import { supabaseAdmin } from "@/lib/supabase";
import type { RawCandidate, QueryPlan } from "@/modules/scraper/types";

export const maxDuration = 55; // Vercel Hobby limit

/**
 * GET /api/sourcing-stream?jdText=...&plan=...&facebookGroups=...
 * Streams sourcing results as Server-Sent Events.
 * Events:
 *   { type: "raw", source: string, candidates: RawCandidate[] }  — from each source as it lands
 *   { type: "ranked", shortlist: RankedCandidate[] }              — after ranking finishes
 *   { type: "error", message: string }
 *   { type: "done" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    jdText: string;
    plan: QueryPlan;
    facebookGroups?: string[];
  };

  const { jdText, plan, facebookGroups = [] } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      const EARLY_EXIT_COUNT = 20;  // rank immediately once we have this many
      const SOURCE_TIMEOUT_MS = 20_000;

      const raw: RawCandidate[] = [];
      const seen = { urls: new Set<string>(), names: new Set<string>() };

      // Pre-seed dedup with everyone already in the DB (any job) so a repeat search
      // doesn't resurface someone HR already reviewed/approved before.
      try {
        const { data: existing } = await supabaseAdmin()
          .from("candidates")
          .select("name, source_url");
        for (const c of existing ?? []) {
          const url = (c.source_url as string | null)
            ?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "").toLowerCase();
          const name = (c.name as string | null)?.trim().toLowerCase();
          if (url) seen.urls.add(url);
          if (name) seen.names.add(name);
        }
      } catch {
        // Best-effort — if this fails, fall back to no cross-run dedup rather than
        // blocking the search entirely.
      }

      // Resolves as soon as raw.length >= EARLY_EXIT_COUNT
      let earlyResolve!: () => void;
      const earlyExit = new Promise<void>((resolve) => { earlyResolve = resolve; });

      function dedup(list: RawCandidate[]): RawCandidate[] {
        const out: RawCandidate[] = [];
        for (const c of list) {
          const url = c.sourceUrl?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "").toLowerCase() ?? "";
          const name = c.name?.trim().toLowerCase() ?? "";
          if (url && seen.urls.has(url)) continue;
          if (name && seen.names.has(name)) continue;
          if (url) seen.urls.add(url);
          if (name) seen.names.add(name);
          out.push(c);
        }
        return out;
      }

      function handleSource(sourceName: string, candidates: RawCandidate[]) {
        const fresh = dedup(candidates);
        if (fresh.length > 0) {
          raw.push(...fresh);
          send({ type: "raw", source: sourceName, candidates: fresh });
          if (raw.length >= EARLY_EXIT_COUNT) earlyResolve();
        }
      }

      function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
        return Promise.race([
          p,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), ms)
          ),
        ]);
      }

      try {
        const picked = new Set(plan.queries.map((q) => q.source));
        // Prefer source-specific English queries from the plan; fall back to first query
        const webQuery = plan.queries.find((q) => q.source === "WEB")?.query
          ?? plan.queries[0]?.query ?? jdText.slice(0, 120);
        const githubQuery = plan.queries.find((q) => q.source === "GITHUB")?.query ?? webQuery;

        const tasks: Promise<void>[] = [];

        tasks.push(
          withTimeout(
            webSearchCandidates(jdText, ["github.com", "linkedin.com/in", "stackoverflow.com/users", "dev.to"], webQuery),
            SOURCE_TIMEOUT_MS,
          )
            .then((found) =>
              handleSource("AI Web Search", found.map((c) => ({
                source: "WEB" as const,
                sourceUrl: c.sourceUrl,
                name: c.name,
                headline: c.headline,
                snippet: c.snippet,
              })))
            ).catch(() => send({ type: "sourceError", source: "AI Web Search" }))
        );

        tasks.push(
          withTimeout(githubCandidates(githubQuery), SOURCE_TIMEOUT_MS)
            .then((r) => handleSource("GitHub", r))
            .catch((e) => send({ type: "sourceError", source: "GitHub", detail: String(e?.message ?? e) }))
        );

        if (picked.has("LINKEDIN")) {
          tasks.push(
            withTimeout(linkedinCandidates(webQuery), SOURCE_TIMEOUT_MS)
              .then((r) => handleSource("LinkedIn", r))
              .catch((e) => send({ type: "sourceError", source: "LinkedIn", detail: String(e?.message ?? e) }))
          );
        }

        if (picked.has("FACEBOOK") && facebookGroups.length > 0) {
          tasks.push(
            withTimeout(facebookCandidates(webQuery, facebookGroups), SOURCE_TIMEOUT_MS)
              .then((r) => handleSource("Facebook", r))
              .catch((e) => send({ type: "sourceError", source: "Facebook", detail: String(e?.message ?? e) }))
          );
        }

        // JobsDB + JobThai via Apify actors (no Playwright needed)
        const jobQuery = plan.queries.find((q) => q.source === "JOBSDB" || q.source === "JOBTHAI")?.query ?? webQuery;
        if (picked.has("JOBSDB")) {
          tasks.push(
            withTimeout(jobsdbCandidates(jobQuery), SOURCE_TIMEOUT_MS)
              .then((r) => handleSource("JobsDB", r))
              .catch((e) => send({ type: "sourceError", source: "JobsDB", detail: String(e?.message ?? e) }))
          );
        }
        if (picked.has("JOBTHAI")) {
          tasks.push(
            withTimeout(jobthaiCandidates(jobQuery), SOURCE_TIMEOUT_MS)
              .then((r) => handleSource("JobThai", r))
              .catch((e) => send({ type: "sourceError", source: "JobThai", detail: String(e?.message ?? e) }))
          );
        }

        // Race: either we collect EARLY_EXIT_COUNT candidates OR all sources finish/timeout
        await Promise.race([earlyExit, Promise.all(tasks)]);

        if (raw.length === 0) {
          send({ type: "error", message: "ไม่พบผู้สมัครจากคำค้นนี้ ลองปรับ JD หรือคำค้น" });
          controller.close();
          return;
        }

        // Rank after all sources done
        send({ type: "ranking" });
        const result = await rankCandidates(jdText, raw.slice(0, 20));
        send({ type: "ranked", shortlist: result.shortlist });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "ผิดพลาด" });
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
