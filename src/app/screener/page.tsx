import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { ScreenerFlow } from "@/modules/screener/screener-flow";

export const metadata = { title: "Resume Screener" };

const meta = NAV_ITEMS.find((i) => i.href === "/screener")!;

export default function ScreenerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="AI Resume Screener" description={meta.description} />
      <ScreenerFlow />
    </div>
  );
}
