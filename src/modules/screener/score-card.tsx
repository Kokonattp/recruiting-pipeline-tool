"use client";

import { scoreBand } from "@/lib/types";
import type { Screening } from "./types";

const BAND_BG: Record<"low" | "mid" | "high", string> = {
  low: "bg-[var(--score-low)]",
  mid: "bg-[var(--score-mid)]",
  high: "bg-[var(--score-high)]",
};

/** One axis: label, big score, reasoning, and a 0-10 bar colored by band. */
function Axis({ label, score, reason }: { label: string; score: number; reason: string }) {
  const band = scoreBand(score);
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg p-4">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-ink">{label}</h4>
        <span className="text-lg font-semibold tabular-nums text-ink">
          {score}
          <span className="text-xs font-normal text-ink-3">/10</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${BAND_BG[band]}`} style={{ width: `${score * 10}%` }} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-2">{reason}</p>
    </div>
  );
}

/** Full screening result: 3 axes + strengths + prescreen questions + panel summary.
 *  `candidateName`/`jobTitle` head the printable report; "พิมพ์ / บันทึก PDF" opens the
 *  browser print dialog (Save as PDF) — no extra dependency, prints just the report. */
export function ScoreCard({
  screening,
  candidateName,
  jobTitle,
}: {
  screening: Screening;
  candidateName?: string;
  jobTitle?: string;
}) {
  return (
    <div id="screening-report" className="space-y-5">
      <div className="flex items-start justify-between gap-3 print:mb-2">
        <div>
          <h3 className="text-lg font-semibold text-ink">
            รายงานผลคัดกรอง{candidateName ? `: ${candidateName}` : ""}
          </h3>
          {jobTitle && <p className="text-xs text-ink-3">ตำแหน่ง: {jobTitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print shrink-0 rounded-[var(--radius-card)] border border-border px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-2"
        >
          ⤓ พิมพ์ / บันทึก PDF
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Axis label="Skills Fit" score={screening.skillsFit} reason={screening.reasoning.skills} />
        <Axis label="Experience Fit" score={screening.expFit} reason={screening.reasoning.experience} />
        <Axis label="Culture Fit" score={screening.cultureFit} reason={screening.reasoning.culture} />
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <h4 className="text-sm font-medium text-ink">สรุปสำหรับทีมสัมภาษณ์</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{screening.summary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {screening.strengths.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-medium text-[var(--success)]">จุดแข็ง</h4>
            <ul className="space-y-1.5">
              {screening.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-2">
                  <span aria-hidden className="text-[var(--success)]">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}
        {screening.prescreenQuestions.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-medium text-[var(--warning)]">ถามเพิ่มตอน prescreen</h4>
            <ul className="space-y-1.5">
              {screening.prescreenQuestions.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-2">
                  <span aria-hidden className="text-ink-3">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
