import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { SourcingFlow } from "@/modules/scraper/sourcing-flow";

export const metadata = { title: "Candidate Sourcing" };

const meta = NAV_ITEMS.find((i) => i.href === "/scraper")!;

export default function ScraperPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader module={meta.module} title="Candidate Sourcing" description={meta.description} />
      <SourcingFlow />
    </div>
  );
}
