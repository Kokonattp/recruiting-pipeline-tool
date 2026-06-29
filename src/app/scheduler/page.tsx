import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getInterviews } from "@/modules/scheduler/queries";
import { isGoogleConnected } from "@/modules/scheduler/actions";
import { getApplications } from "@/modules/tracker/queries";
import { SchedulerFlow } from "@/modules/scheduler/scheduler-flow";
import { SchedulerIcon } from "@/components/module-icons";

export const metadata = { title: "Interview Scheduler" };

const meta = NAV_ITEMS.find((i) => i.href === "/scheduler")!;

export default async function SchedulerPage() {
  const [interviews, applications, connected] = await Promise.all([
    getInterviews(),
    getApplications(),
    isGoogleConnected(),
  ]);

  // candidates worth scheduling: anywhere in the active funnel, not hired/rejected
  const schedulable = applications.filter(
    (a) => a.stage !== "HIRED" && a.stage !== "REJECTED",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="Interview Scheduler" description={meta.description} icon={<SchedulerIcon />} />
      <SchedulerFlow interviews={interviews} candidates={schedulable} googleConnected={connected} />
    </div>
  );
}
