import { PageHeader } from "@/components/page-header";
import { NAV_ITEMS } from "@/components/nav";
import { getApplications } from "@/modules/tracker/queries";
import { TrackerBoard } from "@/modules/tracker/tracker-board";
import { TrackerOnboarding } from "@/modules/tracker/tracker-onboarding";

export const metadata = { title: "Applicant Tracker" };

const meta = NAV_ITEMS.find((i) => i.href === "/tracker")!;

const addButton = (
  <button
    type="button"
    className="inline-flex h-9 items-center rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
  >
    เพิ่มผู้สมัครเอง
  </button>
);

export default async function TrackerPage() {
  const applications = await getApplications();
  const hasData = applications.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        module={meta.module}
        title="Applicant Tracker"
        description={meta.description}
        actions={
          hasData ? (
            <button
              type="button"
              className="h-9 rounded-[var(--radius-card)] bg-primary px-4 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90"
            >
              + เพิ่มผู้สมัคร
            </button>
          ) : null
        }
      />

      {hasData ? (
        <TrackerBoard initial={applications} />
      ) : (
        <TrackerOnboarding onAddManually={addButton} />
      )}
    </div>
  );
}
