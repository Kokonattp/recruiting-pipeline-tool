import { NextRequest } from "next/server";
import { webSearchCandidates } from "@/lib/web-search";
import { githubCandidates, linkedinCandidates, facebookCandidates } from "@/lib/sourcing-apis";
import { rankCandidates } from "@/modules/scraper/ai";
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

      const raw: RawCandidate[] = [];
      const seen = { urls: new Set<string>(), names: new Set<string>() };

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
        }
      }

      try {
        const picked = new Set(plan.queries.map((q) => q.source));
        const firstQuery = plan.queries[0]?.query ?? jdText.slice(0, 120);

        // Fan out all sources in parallel, stream each as it resolves
        const tasks: Promise<void>[] = [];

        tasks.push(
          webSearchCandidates(jdText, ["github.com"]).then((found) =>
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
          githubCandidates(firstQuery)
            .then((r) => handleSource("GitHub", r))
            .catch(() => send({ type: "sourceError", source: "GitHub" }))
        );

        if (picked.has("LINKEDIN")) {
          tasks.push(
            linkedinCandidates(firstQuery)
              .then((r) => handleSource("LinkedIn", r))
              .catch(() => send({ type: "sourceError", source: "LinkedIn" }))
          );
        }

        if (picked.has("FACEBOOK") && facebookGroups.length > 0) {
          tasks.push(
            facebookCandidates(firstQuery, facebookGroups)
              .then((r) => handleSource("Facebook", r))
              .catch(() => send({ type: "sourceError", source: "Facebook" }))
          );
        }

        const serviceUrl = process.env.SCRAPER_SERVICE_URL;
        if (serviceUrl) {
          tasks.push(
            fetch(`${serviceUrl}/scrape`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ secret: process.env.SCRAPER_INGEST_SECRET, queries: plan.queries }),
            })
              .then((res) => res.ok ? res.json() : Promise.reject(new Error(`scraper ${res.status}`)))
              .then((data: { candidates: RawCandidate[] }) => handleSource("Scraper", data.candidates))
              .catch(() => send({ type: "sourceError", source: "Scraper" }))
          );
        }

        // Race: stream raw as sources land
        await Promise.all(tasks);

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
