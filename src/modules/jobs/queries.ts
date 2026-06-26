import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { toJob } from "@/lib/mappers";
import type { JobDescription } from "@/lib/types";

/** All job descriptions (the roles HR is hiring for). Used to pick a JD in Screener / Sourcing. */
export async function getJobs(): Promise<JobDescription[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabaseAdmin()
    .from("job_descriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getJobs failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => toJob(r as Record<string, unknown>));
}
