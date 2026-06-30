import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getJobs } from "@/modules/jobs/queries";
import { getApplications } from "@/modules/tracker/queries";
import { ScreenerFlow } from "@/modules/screener/screener-flow";
import { ScreenerIcon } from "@/components/module-icons";

export const metadata = { title: "Resume Screener" };

const meta = NAV_ITEMS.find((i) => i.href === "/screener")!;

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<{ cand?: string; job?: string }>;
}) {
  const { cand, job } = await searchParams;
  const jobs = await getJobs();

  // When arriving from a Tracker card ("คัดกรอง"), pre-select that candidate's job and
  // show whose CV is being screened. HR then just attaches the CV.
  let candidateName: string | undefined;
  let applicationId: string | undefined;
  if (cand) {
    const apps = await getApplications();
    const app = apps.find((a) => a.candidate.id === cand);
    if (app) {
      candidateName = app.candidate.name;
      applicationId = app.id;
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="AI Resume Screener" description={meta.description} icon={<ScreenerIcon />} />
      <ScreenerFlow
        jobs={jobs}
        initialJobId={job}
        candidateName={candidateName}
        applicationId={applicationId}
      />
    </div>
  );
}
