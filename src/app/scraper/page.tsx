import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getJobs } from "@/modules/jobs/queries";
import { SourcingPage } from "@/modules/scraper/sourcing-page";

export const metadata = { title: "Candidate Sourcing" };

const meta = NAV_ITEMS.find((i) => i.href === "/scraper")!;

export default async function ScraperPage() {
  const jobs = await getJobs();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader module={meta.module} title="Candidate Sourcing" description={meta.description} />
      <SourcingPage jobs={jobs} />
    </div>
  );
}
