import type { Source, Stage } from "@/lib/types";

/** Tracker view + filter state (client-side, lives in the board container). */
export type TrackerView = "board" | "list";

export interface TrackerFilters {
  /** free-text match on candidate name / headline */
  search: string;
  /** null = all sources */
  source: Source | null;
  /** null = all stages (list view only; board shows every stage as a column) */
  stage: Stage | null;
}

export const EMPTY_FILTERS: TrackerFilters = {
  search: "",
  source: null,
  stage: null,
};
