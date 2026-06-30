import type { Source, Stage } from "@/lib/types";

/** Tracker view + filter state (client-side, lives in the board container). */
export type TrackerView = "board" | "list";

export interface TrackerFilters {
  /** free-text match on candidate name / headline */
  search: string;
  /** null = all sources */
  source: Source | null;
  /** null = all stages */
  stage: Stage | null;
  /** null = all positions */
  jobId: string | null;
}

export const EMPTY_FILTERS: TrackerFilters = {
  search: "",
  source: null,
  stage: null,
  jobId: null,
};
