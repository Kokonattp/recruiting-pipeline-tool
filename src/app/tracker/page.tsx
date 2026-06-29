import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getApplications } from "@/modules/tracker/queries";
import { getJobs } from "@/modules/jobs/queries";
import { TrackerBoard } from "@/modules/tracker/tracker-board";
import { TrackerOnboarding } from "@/modules/tracker/tracker-onboarding";
import { StatBar } from "@/modules/tracker/stat-bar";
import { AddCandidateDialog } from "@/modules/tracker/add-candidate-dialog";
import { TrackerIcon } from "@/components/module-icons";

export const metadata = { title: "Applicant Tracker" };

const meta = NAV_ITEMS.find((i) => i.href === "/tracker")!;

export default async function TrackerPage() {
  const [applications, jobs] = await Promise.all([getApplications(), getJobs()]);
  const hasData = applications.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        module={meta.module}
        title="Applicant Tracker"
        description={meta.description}
        icon={<TrackerIcon />}
        actions={hasData ? <AddCandidateDialog jobs={jobs} /> : null}
      />

      {hasData ? (
        <>
          <StatBar applications={applications} />
          <TrackerBoard initial={applications} />
        </>
      ) : (
        <TrackerOnboarding onAddManually={<AddCandidateDialog jobs={jobs} />} />
      )}
    </div>
  );
}
