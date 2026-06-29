import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getJobs } from "@/modules/jobs/queries";
import { ScreenerFlow } from "@/modules/screener/screener-flow";
import { ScreenerIcon } from "@/components/module-icons";

export const metadata = { title: "Resume Screener" };

const meta = NAV_ITEMS.find((i) => i.href === "/screener")!;

export default async function ScreenerPage() {
  const jobs = await getJobs();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="AI Resume Screener" description={meta.description} icon={<ScreenerIcon />} />
      <ScreenerFlow jobs={jobs} />
    </div>
  );
}
