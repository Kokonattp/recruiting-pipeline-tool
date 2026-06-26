import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NAV_ITEMS } from "@/components/nav";

const meta = NAV_ITEMS.find((i) => i.href === "/scheduler")!;

export default function SchedulerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="Interview Scheduler" description={meta.description} />
      <EmptyState
        title="ยังไม่มีนัดสัมภาษณ์"
        description="สร้างนัดสัมภาษณ์ลง Google Calendar พร้อม Meet link อัตโนมัติ แนบคำถามที่ควรถามเพิ่มจาก resume ตรวจจับเวลาซ้อน (conflict) และ sync สถานะกลับ Tracker เมื่อแก้/ยกเลิก"
        hint="ต้องเชื่อมต่อ Google Calendar (OAuth) ก่อนเริ่มใช้งาน"
      />
    </div>
  );
}
