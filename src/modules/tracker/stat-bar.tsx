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

  const stats: { label: string; value: number; tone?: "success" | "danger" }[] = [
    { label: "ผู้สมัครทั้งหมด", value: total },
    { label: "กำลังสัมภาษณ์", value: interviewing },
    { label: "รอคัดกรอง", value: inReview },
    { label: "รับแล้ว", value: hired, tone: "success" },
    { label: "ไม่ผ่าน", value: rejected, tone: "danger" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
        >
          <div
            className={[
              "text-2xl font-semibold tabular-nums",
              s.tone === "success"
                ? "text-[var(--success)]"
                : s.tone === "danger"
                  ? "text-[var(--danger)]"
                  : "text-ink",
            ].join(" ")}
          >
            {s.value}
          </div>
          <div className="mt-0.5 text-xs text-ink-2">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
