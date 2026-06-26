import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NAV_ITEMS } from "@/components/nav";

const meta = NAV_ITEMS.find((i) => i.href === "/tracker")!;

export default function TrackerPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader module={meta.module} title="Applicant Tracker" description={meta.description} />
      <EmptyState
        title="ยังไม่มีผู้สมัครในระบบ"
        description="ภาพรวมผู้สมัครทุกคนว่าอยู่ขั้นตอนไหนของ pipeline — Applied → Screening → Pre-Screen Call → First Interview → Offer → Hired/Rejected ย้าย stage ได้ด้วย drag & drop"
        hint="ต้องตั้งค่า Supabase ก่อนเริ่มใช้งาน"
      />
    </div>
  );
}
