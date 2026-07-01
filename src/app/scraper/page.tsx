import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getJobs } from "@/modules/jobs/queries";
import { SourcingPage } from "@/modules/scraper/sourcing-page";
import { SourcingIcon } from "@/components/module-icons";

export const metadata = { title: "Candidate Sourcing" };
// generateQueryPlan/approveCandidates are Server Actions on this page (separate from
// the SSE sourcing-stream route, which sets its own maxDuration) — give them the same
// headroom so a slow Claude call doesn't get silently killed mid-request.
export const maxDuration = 60;

const meta = NAV_ITEMS.find((i) => i.href === "/scraper")!;

export default async function ScraperPage() {
  const jobs = await getJobs();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader module={meta.module} title="Candidate Sourcing" description={meta.description} icon={<SourcingIcon />} />
      <SourcingPage jobs={jobs} />
    </div>
  );
}
