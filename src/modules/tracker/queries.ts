import type { ApplicationWithRelations } from "@/lib/types";

/**
 * Data access for the Applicant Tracker.
 *
 * Returns real rows from Supabase. Until the database is wired (env keys + schema),
 * this returns an empty list so the UI renders its empty state — we never fabricate
 * candidates. Phase B replaces the body with a Supabase query; the UI doesn't change.
 */
export async function getApplications(): Promise<ApplicationWithRelations[]> {
  // TODO(phase B): query Supabase, e.g.
  //   const db = supabaseAdmin();
  //   const { data } = await db
  //     .from("applications")
  //     .select("*, candidate:candidates(*), job:job_descriptions(id,title), screening:screening_results(*)")
  //     .order("applied_at", { ascending: false });
  //   return data.map(rowToApplication);
  return [];
}
