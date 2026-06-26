import type {
  Application,
  ApplicationWithRelations,
  Candidate,
  Interview,
  JobDescription,
  ScreeningResult,
} from "./types";

/**
 * Row mappers: Supabase returns snake_case columns; the app uses camelCase types.
 * Centralizing the conversion here keeps every query consistent and means a schema
 * change is fixed in one place, not scattered across modules. Inputs are typed as
 * loose records because supabase-js returns `any`-ish rows.
 */

type Row = Record<string, unknown>;

export function toCandidate(r: Row): Candidate {
  return {
    id: r.id as string,
    name: r.name as string,
    email: (r.email as string) ?? null,
    phone: (r.phone as string) ?? null,
    source: r.source as Candidate["source"],
    sourceUrl: (r.source_url as string) ?? null,
    headline: (r.headline as string) ?? null,
    rawProfile: (r.raw_profile as Record<string, unknown>) ?? null,
    normalized: (r.normalized as Record<string, unknown>) ?? null,
    reviewStatus: r.review_status as Candidate["reviewStatus"],
    createdAt: r.created_at as string,
  };
}

export function toJob(r: Row): JobDescription {
  return {
    id: r.id as string,
    title: r.title as string,
    department: (r.department as string) ?? null,
    seniority: (r.seniority as string) ?? null,
    rawText: r.raw_text as string,
    requiredSkills: (r.required_skills as string[]) ?? [],
    niceToHave: (r.nice_to_have as string[]) ?? [],
    createdAt: r.created_at as string,
  };
}

export function toApplication(r: Row): Application {
  return {
    id: r.id as string,
    candidateId: r.candidate_id as string,
    jobId: r.job_id as string,
    stage: r.stage as Application["stage"],
    appliedAt: r.applied_at as string,
    sourceTag: (r.source_tag as string) ?? null,
  };
}

export function toScreening(r: Row): ScreeningResult {
  return {
    id: r.id as string,
    applicationId: r.application_id as string,
    skillsFit: r.skills_fit as number,
    expFit: r.exp_fit as number,
    cultureFit: r.culture_fit as number,
    reasoning: r.reasoning as ScreeningResult["reasoning"],
    strengths: (r.strengths as string[]) ?? [],
    prescreenQuestions: (r.prescreen_questions as string[]) ?? [],
    summary: r.summary as string,
    model: r.model as string,
    createdAt: r.created_at as string,
  };
}

export function toInterview(r: Row): Interview {
  return {
    id: r.id as string,
    applicationId: r.application_id as string,
    scheduledAt: r.scheduled_at as string,
    durationMin: r.duration_min as number,
    googleEventId: (r.google_event_id as string) ?? null,
    meetLink: (r.meet_link as string) ?? null,
    status: r.status as Interview["status"],
    notes: (r.notes as string) ?? null,
    createdAt: r.created_at as string,
  };
}

/**
 * The Tracker board needs application + candidate + job + latest screening in one shape.
 * `candidate` / `job` come from the embedded select; `screening` is a 0-or-1 relation
 * that supabase-js returns as an array, so we take the first row.
 */
export function toApplicationWithRelations(r: Row): ApplicationWithRelations {
  const candidate = toCandidate(r.candidate as Row);
  const jobRow = r.job as Row;
  const screeningRows = (r.screening as Row[] | null) ?? [];
  return {
    ...toApplication(r),
    candidate,
    job: { id: jobRow.id as string, title: jobRow.title as string },
    screening: screeningRows.length > 0 ? toScreening(screeningRows[0]) : null,
  };
}
