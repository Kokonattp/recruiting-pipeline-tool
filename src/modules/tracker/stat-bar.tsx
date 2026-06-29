import type { ApplicationWithRelations } from "@/lib/types";

/**
 * Pipeline summary across the top of the Tracker (the dashboard numbers from the spec).
 * Pure derivation from the applications already loaded — no extra query.
 */
export function StatBar({ applications }: { applications: ApplicationWithRelations[] }) {
  const total = applications.length;
  const hired = applications.filter((a) => a.stage === "HIRED").length;
  const rejected = applications.filter((a) => a.stage === "REJECTED").length;
  const interviewing = applications.filter(
    (a) => a.stage === "PRESCREEN_CALL" || a.stage === "FIRST_INTERVIEW" || a.stage === "OFFER",
  ).length;
  const inReview = applications.filter(
    (a) => a.stage === "APPLIED" || a.stage === "SCREENING",
  ).length;

  const stats: { label: string; value: number; tone: "primary" | "info" | "neutral" | "success" | "danger" }[] = [
    { label: "ผู้สมัครทั้งหมด", value: total, tone: "primary" },
    { label: "กำลังสัมภาษณ์", value: interviewing, tone: "info" },
    { label: "รอคัดกรอง", value: inReview, tone: "neutral" },
    { label: "รับแล้ว", value: hired, tone: "success" },
    { label: "ไม่ผ่าน", value: rejected, tone: "danger" },
  ];

  const TONE: Record<string, { num: string; dot: string }> = {
    primary: { num: "text-primary", dot: "var(--primary)" },
    info: { num: "text-ink", dot: "oklch(0.6 0.16 200)" },
    neutral: { num: "text-ink", dot: "var(--border-strong)" },
    success: { num: "text-[var(--success)]", dot: "var(--success)" },
    danger: { num: "text-[var(--danger)]", dot: "var(--danger)" },
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="loga-card rounded-[var(--radius-card)] border bg-surface px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: TONE[s.tone].dot }}
            />
            <div className="text-xs font-medium text-ink-2">{s.label}</div>
          </div>
          <div className={`mt-1 text-2xl font-bold tabular-nums ${TONE[s.tone].num}`}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
