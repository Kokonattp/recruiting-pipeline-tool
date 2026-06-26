import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NAV_ITEMS } from "@/components/nav";

export const metadata = { title: "Candidate Sourcing" };

const meta = NAV_ITEMS.find((i) => i.href === "/scraper")!;

export default function ScraperPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="Candidate Sourcing" description={meta.description} />
      <EmptyState
        title="ยังไม่มีรอบการค้นหา"
        description="วาง Job Description แล้วระบบจะให้ AI สร้าง search query ค้นหาผู้สมัครจาก LinkedIn, JobsDB, JobThai, Facebook และเว็บ จากนั้นจัดอันดับความเหมาะให้ HR ตรวจก่อนนำเข้าระบบ"
        hint="ต้องตั้งค่า ANTHROPIC_API_KEY และ scraper service ก่อนเริ่มใช้งาน"
      />
    </div>
  );
}
