// Shared domain types — mirror the Supabase Postgres schema (supabase/migrations).
// These are the single source of truth used across all 4 modules.

export type Stage =
  | "APPLIED"
  | "SCREENING"
  | "PRESCREEN_CALL"
  | "FIRST_INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export const STAGES: Stage[] = [
  "APPLIED",
  "SCREENING",
  "PRESCREEN_CALL",
  "FIRST_INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

/** Ordered pipeline stages shown as board columns (terminal states handled separately). */
export const PIPELINE_STAGES: Stage[] = [
  "APPLIED",
  "SCREENING",
  "PRESCREEN_CALL",
  "FIRST_INTERVIEW",
  "OFFER",
];

export const STAGE_LABELS: Record<Stage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  PRESCREEN_CALL: "Prescreen Call",
  FIRST_INTERVIEW: "First Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

/**
 * Each stage owns a hue (the dot/accent on its column header + card rail).
 * Progression reads warm→cool→green as candidates advance; terminal states are
 * unambiguous (green hired / red rejected). Values are OKLCH hue tokens consumed
 * via CSS custom props, so they adapt to light/dark.
 */
export const STAGE_HUE: Record<Stage, string> = {
  APPLIED: "250", // slate-blue (neutral entry)
  SCREENING: "290", // violet
  PRESCREEN_CALL: "230", // blue
  FIRST_INTERVIEW: "200", // cyan
  OFFER: "150", // green-leaning (almost there)
  HIRED: "150", // green
  REJECTED: "25", // red
};

/** Score band for a 0-10 fit score → which functional color the chip uses. */
export function scoreBand(score: number): "low" | "mid" | "high" {
  if (score <= 4) return "low";
  if (score <= 7) return "mid";
  return "high";
}

export type Source =
  | "LINKEDIN"
  | "JOBSDB"
  | "JOBBKK"
  | "JOBTHAI"
  | "FACEBOOK"
  | "GITHUB"
  | "WEB"
  | "REFERRAL"
  | "MANUAL";

export const SOURCES: Source[] = [
  "LINKEDIN",
  "JOBSDB",
  "JOBBKK",
  "JOBTHAI",
  "FACEBOOK",
  "GITHUB",
  "WEB",
  "REFERRAL",
  "MANUAL",
];

export const SOURCE_LABELS: Record<Source, string> = {
  LINKEDIN: "LinkedIn",
  JOBSDB: "JobsDB",
  JOBBKK: "JobBKK",
  JOBTHAI: "JobThai",
  FACEBOOK: "Facebook",
  GITHUB: "GitHub",
  WEB: "Web",
  REFERRAL: "Referral",
  MANUAL: "Manual",
};

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ScrapeStatus = "RUNNING" | "COMPLETED" | "FAILED";
export type InterviewStatus =
  | "SCHEDULED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "COMPLETED";

export interface JobDescription {
  id: string;
  title: string;
  department: string | null;
  seniority: string | null;
  rawText: string;
  requiredSkills: string[];
  niceToHave: string[];
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: Source;
  sourceUrl: string | null;
  headline: string | null;
  rawProfile: Record<string, unknown> | null;
  normalized: Record<string, unknown> | null;
  reviewStatus: ReviewStatus;
  createdAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  stage: Stage;
  appliedAt: string;
  sourceTag: string | null;
}

/** One named sub-attribute under an axis (e.g. "SQL/Data Tools": 8/10) — explains WHY
 *  the axis landed where it did. Scored independently of the axis total, not derived from it. */
export interface SubAttribute {
  label: string;
  score: number; // 0-10
}

export interface ScreeningResult {
  id: string;
  applicationId: string;
  skillsFit: number; // 0-10
  expFit: number; // 0-10
  cultureFit: number; // 0-10
  reasoning: { skills: string; experience: string; culture: string };
  /** Optional: older rows (pre sub-attribute migration) have no breakdown. */
  subAttributes?: { skills: SubAttribute[]; experience: SubAttribute[]; culture: SubAttribute[] };
  confidence: "HIGH" | "MEDIUM" | "LOW";
  recommendation: "STRONG" | "CONSIDER" | "WEAK";
  strengths: string[];
  prescreenQuestions: string[];
  summary: string;
  model: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: string;
  durationMin: number;
  googleEventId: string | null;
  meetLink: string | null;
  status: InterviewStatus;
  notes: string | null;
  createdAt: string;
}

/** Application joined with its candidate + latest screening — the shape the Tracker board consumes. */
export interface ApplicationWithRelations extends Application {
  candidate: Candidate;
  job: Pick<JobDescription, "id" | "title">;
  screening: ScreeningResult | null;
}
