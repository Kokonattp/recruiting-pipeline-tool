import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { toInterview } from "@/lib/mappers";
import type { Interview } from "@/lib/types";

/**
 * Interviews for the scheduler. Real rows from Supabase, ordered by time; empty until
 * the database is wired (the agenda shows its empty state, conflict detection has
 * nothing to clash against). No fabricated interviews.
 */
export async function getInterviews(): Promise<Interview[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabaseAdmin()
    .from("interviews")
    .select("*")
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("getInterviews failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => toInterview(r as Record<string, unknown>));
}
