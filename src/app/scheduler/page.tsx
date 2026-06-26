import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getInterviews } from "@/modules/scheduler/queries";
import { SchedulerFlow } from "@/modules/scheduler/scheduler-flow";

export const metadata = { title: "Interview Scheduler" };

const meta = NAV_ITEMS.find((i) => i.href === "/scheduler")!;

export default async function SchedulerPage() {
  const interviews = await getInterviews();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="Interview Scheduler" description={meta.description} />
      <SchedulerFlow interviews={interviews} />
    </div>
  );
}
