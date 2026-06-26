import Link from "next/link";
import { PIPELINE_STAGES, STAGE_HUE, STAGE_LABELS } from "@/lib/types";

/**
 * First-run state for the Tracker. Instead of a hollow "no data" box, this teaches the
 * interface: it shows the empty pipeline HR will be filling, and the two real ways a
 * candidate enters the system (AI sourcing, or manual add). No fabricated candidates.
 */
export function TrackerOnboarding({ onAddManually }: { onAddManually?: React.ReactNode }) {
  return (
    <div className="space-y-8">
      {/* the pipeline they'll be working, shown empty so the structure is legible */}
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage}
            className="flex min-w-40 flex-1 flex-col gap-2 rounded-[var(--radius-card)] border border-dashed border-border bg-surface-2/60 p-3"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: `oklch(0.62 0.16 ${STAGE_HUE[stage]})` }}
              />
              <span className="text-xs font-medium text-ink-2">{STAGE_LABELS[stage]}</span>
              <span className="ml-auto text-xs tabular-nums text-ink-3">0</span>
            </div>
            <div className="h-12 rounded-md border border-dashed border-border/70" />
          </div>
        ))}
      </div>

      {/* two real intake paths */}
      <div className="grid gap-4 md:grid-cols-2">
        <IntakeCard
          step="วิธีที่ 1"
          title="ให้ AI หาผู้สมัครให้"
          body="วาง Job Description แล้วระบบจะสร้างคำค้นหา ดูดผู้สมัครจาก LinkedIn / JobsDB / JobThai / เว็บ แล้วจัดอันดับให้คุณตรวจก่อนนำเข้า"
          action={
            <Link
              href="/scraper"
              className="inline-flex h-9 items-center rounded-[var(--radius-card)] bg-primary px-4 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90"
            >
              เริ่มที่ Sourcing
            </Link>
          }
        />
        <IntakeCard
          step="วิธีที่ 2"
          title="เพิ่มผู้สมัครเอง"
          body="มีผู้สมัครที่รู้จักอยู่แล้ว (referral หรือสมัครตรง)? เพิ่มเข้าระบบด้วยมือ แล้วลากเข้าขั้นของ pipeline ได้ทันที"
          action={onAddManually}
        />
      </div>
    </div>
  );
}

function IntakeCard({
  step,
  title,
  body,
  action,
}: {
  step: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <span className="text-xs font-medium text-ink-3">{step}</span>
      <h3 className="mt-1 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm text-ink-2">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
