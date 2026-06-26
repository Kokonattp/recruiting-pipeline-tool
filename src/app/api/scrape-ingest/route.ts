import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { IngestPayloadSchema } from "@/modules/scraper/types";

/**
 * Ingest endpoint for the scraper service. The service POSTs raw scraped candidates
 * here; we authenticate with a shared secret, then persist them with review_status
 * PENDING (so they wait for HR approval — human-in-the-loop). The web app's approve
 * action flips them to APPROVED and creates the application.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = IngestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { secret, candidates } = parsed.data;
  if (secret !== process.env.SCRAPER_INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = candidates.map((c) => ({
    name: c.name ?? "(ไม่ระบุชื่อ)",
    source: c.source,
    source_url: c.sourceUrl ?? null,
    headline: c.headline ?? null,
    raw_profile: { snippet: c.snippet ?? null },
    review_status: "PENDING" as const,
  }));

  const { error, count } = await supabaseAdmin()
    .from("candidates")
    .insert(rows, { count: "exact" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ inserted: count ?? rows.length });
}
