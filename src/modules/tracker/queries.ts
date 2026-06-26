import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { toApplicationWithRelations } from "@/lib/mappers";
import type { ApplicationWithRelations } from "@/lib/types";

/**
 * Data access for the Applicant Tracker. Returns real applications from Supabase,
 * joined with their candidate, job, and latest screening. When Supabase isn't
 * configured yet (no env), returns an empty list so the UI shows its onboarding
 * state instead of crashing — we never fabricate candidates.
 */
export async function getApplications(): Promise<ApplicationWithRelations[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabaseAdmin()
    .from("applications")
    .select(
      "*, candidate:candidates(*), job:job_descriptions(id,title), screening:screening_results(*)",
    )
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("getApplications failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => toApplicationWithRelations(r as Record<string, unknown>));
}
