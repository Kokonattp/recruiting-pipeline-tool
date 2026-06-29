import Link from "next/link";
import { PIPELINE_STAGES, STAGE_HUE, STAGE_LABELS } from "@/lib/types";

/**
 * First-run state for the Tracker. Instead of a hollow "no data" box, this teaches the
 * interface: it shows the empty pipeline HR will be filling, and the two real ways a
 * candidate enters the system (AI sourcing, or manual add). No fabricated candidates.
 */
export function TrackerOnboarding({ onAddManually }: { onAddManually?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      {/* welcome hero — sets a confident, inviting tone without faking data */}
      <section
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8"
        style={{ backgroundImage: "var(--hero-wash)" }}
      >
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            เริ่มต้นใช้งาน
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            สร้าง pipeline แรกของคุณ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            ยังไม่มีผู้สมัครในระบบ — เลือกให้ AI ช่วยค้นหาจากหลายแหล่ง หรือเพิ่มคนที่คุณรู้จักเองก็ได้
            แล้วลากผ่านแต่ละขั้นของการสรรหาได้ทันที
          </p>
        </div>

        {/* the pipeline they'll be working — solid hue bars so the structure feels alive, not dashed */}
        <div className="mt-6 flex items-stretch gap-2 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, i) => (
            <div
              key={stage}
              className="flex min-w-36 flex-1 flex-col gap-2 rounded-xl border border-border bg-bg/70 p-3 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-3.5 w-1.5 rounded-full"
                  style={{ background: `oklch(0.6 0.18 ${STAGE_HUE[stage]})` }}
                />
                <span className="truncate text-xs font-semibold text-ink">{STAGE_LABELS[stage]}</span>
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
                  style={{
                    background: `oklch(0.6 0.18 ${STAGE_HUE[stage]} / 0.12)`,
                    color: `oklch(0.5 0.18 ${STAGE_HUE[stage]})`,
                  }}
                >
                  0
                </span>
              </div>
              {/* ghost slot tinted with the stage hue — hints where candidates land, feels alive */}
              <div
                className="h-9 rounded-lg border"
                style={{
                  background: `oklch(0.6 0.18 ${STAGE_HUE[stage]} / 0.05)`,
                  borderColor: `oklch(0.6 0.18 ${STAGE_HUE[stage]} / 0.18)`,
                  opacity: 1 - i * 0.12,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* two real intake paths — primary (AI) leads, manual is the calmer secondary */}
      <div className="grid gap-4 md:grid-cols-2">
        <IntakeCard
          accent
          icon={<SparkIcon />}
          step="แนะนำ"
          title="ให้ AI หาผู้สมัครให้"
          body="วาง Job Description แล้วระบบสร้างคำค้นหา ดูดผู้สมัครจาก LinkedIn / JobsDB / JobThai / เว็บ แล้วจัดอันดับให้คุณตรวจก่อนนำเข้า"
          action={
            <Link
              href="/scraper"
              className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-card)] bg-primary px-5 text-sm font-semibold text-primary-ink shadow-[var(--shadow-primary)] transition-transform hover:-translate-y-0.5"
            >
              เริ่มที่ Sourcing
              <ArrowIcon />
            </Link>
          }
        />
        <IntakeCard
          icon={<PersonIcon />}
          step="หรือ"
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
  icon,
  accent,
}: {
  step: string;
  title: string;
  body: string;
  action?: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "group flex flex-col rounded-2xl border bg-surface p-5 transition-shadow",
        accent
          ? "border-primary/30 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-primary)]"
          : "border-border hover:shadow-[var(--shadow-card)]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            accent ? "bg-primary text-primary-ink" : "bg-surface-2 text-ink-2",
          ].join(" ")}
        >
          {icon}
        </span>
        <div>
          <span
            className={[
              "text-[11px] font-semibold uppercase tracking-wide",
              accent ? "text-primary" : "text-ink-3",
            ].join(" ")}
          >
            {step}
          </span>
          <h3 className="text-base font-bold text-ink">{title}</h3>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-2">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9l-5.6 1.9L12 16l-1.9-5.1L4.5 9l5.6-1.4L12 2z" />
      <circle cx="18.5" cy="17.5" r="1.6" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden
      className="transition-transform group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
