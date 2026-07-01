import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getJobs } from "@/modules/jobs/queries";
import { getApplications } from "@/modules/tracker/queries";
import { ScreenerFlow } from "@/modules/screener/screener-flow";
import { ScreenerIcon } from "@/components/module-icons";

export const metadata = { title: "Resume Screener" };
// Screening a CV can take longer than Vercel's default function timeout,
// silently killing the Server Action mid-call — same reasoning as the
// sourcing-stream route's maxDuration.
export const maxDuration = 60;

const meta = NAV_ITEMS.find((i) => i.href === "/screener")!;

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<{ cand?: string; job?: string }>;
}) {
  const { cand, job } = await searchParams;
  const [jobs, apps] = await Promise.all([getJobs(), getApplications()]);

  // Candidates HR can screen — pick one (or arrive from a Tracker card) to map the score
  // to that person. Active funnel only (not hired/rejected).
  const candidates = apps
    .filter((a) => a.stage !== "HIRED" && a.stage !== "REJECTED")
    .map((a) => ({ applicationId: a.id, candidateId: a.candidate.id, name: a.candidate.name, jobId: a.job.id }));

  // Arriving from a card ("คัดกรอง"): pre-select that candidate.
  const fromCard = cand ? candidates.find((c) => c.candidateId === cand) : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="AI Resume Screener" description={meta.description} icon={<ScreenerIcon />} />
      <ScreenerFlow
        jobs={jobs}
        candidates={candidates}
        initialApplicationId={fromCard?.applicationId}
        initialJobId={fromCard?.jobId ?? job}
      />
    </div>
  );
}
