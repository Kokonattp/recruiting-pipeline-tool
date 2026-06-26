import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NAV_ITEMS } from "@/components/nav";
import { getApplications } from "@/modules/tracker/queries";
import { TrackerBoard } from "@/modules/tracker/tracker-board";

export const metadata = { title: "Applicant Tracker" };

const meta = NAV_ITEMS.find((i) => i.href === "/tracker")!;

export default async function TrackerPage() {
  const applications = await getApplications();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        module={meta.module}
        title="Applicant Tracker"
        description={meta.description}
        actions={
          applications.length > 0 ? (
            <button
              type="button"
              className="h-9 rounded-[var(--radius-card)] bg-primary px-4 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90"
            >
              + เพิ่มผู้สมัคร
            </button>
          ) : null
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          title="ยังไม่มีผู้สมัครในระบบ"
          description="ผู้สมัครจะเข้ามาเมื่อทีม Sourcing ดูดข้อมูลจากแหล่งงาน หรือเพิ่มเองด้วยมือ จากนั้นจะเห็นทุกคนเรียงตามขั้นของ pipeline และลากย้ายขั้นได้"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/scraper"
              className="h-9 rounded-[var(--radius-card)] bg-primary px-4 text-sm font-medium leading-9 text-primary-ink transition-opacity hover:opacity-90"
            >
              ไปหน้า Sourcing
            </Link>
            <button
              type="button"
              className="h-9 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              เพิ่มผู้สมัครด้วยมือ
            </button>
          </div>
        </EmptyState>
      ) : (
        <TrackerBoard initial={applications} />
      )}
    </div>
  );
}
