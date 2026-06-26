import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NAV_ITEMS } from "@/components/nav";

const meta = NAV_ITEMS.find((i) => i.href === "/screener")!;

export default function ScreenerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader module={meta.module} title="AI Resume Screener" description={meta.description} />
      <EmptyState
        title="ยังไม่มีผลการประเมิน"
        description="อัปโหลด CV (PDF) หรือวางข้อความ แล้วเลือกตำแหน่งที่ต้องการ match — Claude จะให้คะแนน 3 ด้าน (Skills / Experience / Culture fit) พร้อมเหตุผลและคำถามที่ควรถามตอนสัมภาษณ์"
        hint="ต้องตั้งค่า ANTHROPIC_API_KEY และ Supabase ก่อนเริ่มใช้งาน"
      />
    </div>
  );
}
