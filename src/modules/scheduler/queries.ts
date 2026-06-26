import type { Interview } from "@/lib/types";

/**
 * Interviews for the scheduler. Returns real rows from Supabase once wired;
 * empty until then (the agenda shows its empty state, the conflict check has
 * nothing to clash against). No fabricated interviews.
 */
export async function getInterviews(): Promise<Interview[]> {
  // TODO(linking phase): supabaseAdmin().from("interviews").select("*").order("scheduled_at")
  return [];
}
