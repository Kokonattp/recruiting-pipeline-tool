"use client";

import { scoreBand } from "@/lib/types";
import type { Recommendation } from "./types";

/** Structural shape both `Screening` (fresh AI result) and `ScreeningResult` (loaded
 *  from the DB, where subAttributes may be absent on rows predating that column)
 *  satisfy — lets one component render either without a type mismatch. */
interface ScoreCardData {
  skillsFit: number;
  expFit: number;
  cultureFit: number;
  reasoning: { skills: string; experience: string; culture: string };
  subAttributes?: {
    skills: { label: string; score: number }[];
    experience: { label: string; score: number }[];
    culture: { label: string; score: number }[];
  };
  confidence: "HIGH" | "MEDIUM" | "LOW";
  strengths: string[];
  prescreenQuestions: string[];
  summary: string;
}

const BAND_BG: Record<"low" | "mid" | "high", string> = {
  low: "bg-[var(--score-low)]",
  mid: "bg-[var(--score-mid)]",
  high: "bg-[var(--score-high)]",
};

const REC_STYLE = {
  STRONG: { label: "แนะนำสัมภาษณ์", cls: "bg-success-soft text-[var(--success)]" },
  CONSIDER: { label: "ควรให้คนดูเพิ่ม", cls: "bg-warning-soft text-[var(--warning)]" },
  WEAK: { label: "น่าจะไม่ตรง", cls: "bg-danger-soft text-[var(--danger)]" },
} as const;

const CONF_LABEL = { HIGH: "ความเชื่อมั่นสูง", MEDIUM: "ความเชื่อมั่นปานกลาง", LOW: "ความเชื่อมั่นต่ำ" } as const;

function RecommendationPill({ value }: { value: keyof typeof REC_STYLE }) {
  const s = REC_STYLE[value];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

function ConfidencePill({ value }: { value: keyof typeof CONF_LABEL }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-2">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: value === "HIGH" ? "var(--success)" : value === "LOW" ? "var(--danger)" : "var(--warning)" }}
      />
      {CONF_LABEL[value]}
    </span>
  );
}

// Per-axis band → label + color token. The badge lets HR scan which axis is the
// candidate's strength vs weakness without reading the numbers.
const AXIS_BADGE: Record<"low" | "mid" | "high", { label: string; color: string }> = {
  high: { label: "ตรงมาก", color: "var(--score-high)" },
  mid: { label: "พอใช้", color: "var(--score-mid)" },
  low: { label: "อ่อน", color: "var(--score-low)" },
};

/** Triangle radar of the 3 fit axes — one glance at overall shape (balanced vs lopsided)
 *  before reading the per-axis detail below. Pure SVG, no chart dependency. */
function RadarTriangle({ skills, exp, culture }: { skills: number; exp: number; culture: number }) {
  const SIZE = 168;
  const CENTER = SIZE / 2;
  const RADIUS = 62;
  // 3 axes at 12 / 4 / 8 o'clock (top, bottom-right, bottom-left).
  const ANGLES = [-90, 30, 150].map((deg) => (deg * Math.PI) / 180);

  const pointAt = (value: number, angleIdx: number) => {
    const r = (Math.max(0, Math.min(10, value)) / 10) * RADIUS;
    const a = ANGLES[angleIdx];
    return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)] as const;
  };

  const values = [skills, exp, culture];
  const dataPoints = values.map((v, i) => pointAt(v, i));
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  // Background grid rings at 25/50/75/100% for scale reference.
  const rings = [0.25, 0.5, 0.75, 1];
  const ringPoints = (frac: number) =>
    ANGLES.map((a) => `${CENTER + RADIUS * frac * Math.cos(a)},${CENTER + RADIUS * frac * Math.sin(a)}`).join(" ");

  const LABELS = ["Skills", "Exp", "Culture"];
  const labelPos = ANGLES.map((a) => [CENTER + (RADIUS + 20) * Math.cos(a), CENTER + (RADIUS + 20) * Math.sin(a)] as const);

  const overallLow = values.every((v) => v <= 3);
  const fillColor = overallLow ? "var(--score-low)" : "var(--primary)";

  return (
    <div className="loga-card flex flex-col items-center gap-2 rounded-[var(--radius-card)] border bg-bg p-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        {rings.map((frac) => (
          <polygon key={frac} points={ringPoints(frac)} fill="none" stroke="var(--border)" strokeWidth={1} />
        ))}
        {ANGLES.map((a, i) => (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={CENTER + RADIUS * Math.cos(a)}
            y2={CENTER + RADIUS * Math.sin(a)}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        <polygon points={dataPath} fill={fillColor} fillOpacity={0.22} stroke={fillColor} strokeWidth={2} strokeLinejoin="round" />
        {dataPoints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.5} fill={fillColor} />
        ))}
        {LABELS.map((label, i) => {
          const [x, y] = labelPos[i];
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-2 text-[10px] font-semibold uppercase tracking-wide"
            >
              {label}
            </text>
          );
        })}
      </svg>
      <p className="text-center text-[11px] text-ink-3">รูปยิ่งเต็ม/สมดุล ยิ่งตรงกับ JD ทุกด้าน</p>
    </div>
  );
}

/** One sub-attribute row, FM-attribute-sheet style: label, a short filled bar, the number. */
function SubAttributeRow({ label, score }: { label: string; score: number }) {
  const band = scoreBand(score);
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 truncate text-[11px] text-ink-3" title={label}>{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${BAND_BG[band]}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums text-ink-2">{score}</span>
    </div>
  );
}

/** One axis: label + a band badge, a big band-colored score, a 0-10 bar, reasoning, and
 *  (if present) the 3 named sub-attributes behind the number — an FM-style breakdown of
 *  WHY it landed here, not a second scoring layer (these don't derive the axis score). */
function Axis({
  label,
  score,
  reason,
  subAttributes,
}: {
  label: string;
  score: number;
  reason: string;
  subAttributes?: { label: string; score: number }[];
}) {
  const band = scoreBand(score);
  const badge = AXIS_BADGE[band];
  return (
    <div className="loga-card rounded-[var(--radius-card)] border bg-bg p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-ink">{label}</h4>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ background: `color-mix(in oklch, ${badge.color} 14%, transparent)`, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: badge.color }}>{score}</span>
        <span className="text-xs font-normal text-ink-3">/10</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${BAND_BG[band]}`} style={{ width: `${score * 10}%` }} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-2">{reason}</p>
      {subAttributes && subAttributes.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-2.5">
          {subAttributes.map((sub) => (
            <SubAttributeRow key={sub.label} label={sub.label} score={sub.score} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Full screening result: 3 axes + strengths + prescreen questions + panel summary.
 *  `candidateName`/`jobTitle` head the printable report; "พิมพ์ / บันทึก PDF" opens the
 *  browser print dialog (Save as PDF) — no extra dependency, prints just the report. */
export function ScoreCard({
  screening,
  recommendation,
  candidateName,
  jobTitle,
}: {
  screening: ScoreCardData;
  recommendation: Recommendation;
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RecommendationPill value={recommendation} />
            <ConfidencePill value={screening.confidence} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print shrink-0 rounded-[var(--radius-card)] border border-border px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-2"
        >
          ⤓ พิมพ์ / บันทึก PDF
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[168px_1fr] sm:items-stretch">
        <div className="no-print">
          <RadarTriangle skills={screening.skillsFit} exp={screening.expFit} culture={screening.cultureFit} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Axis
            label="Skills Fit"
            score={screening.skillsFit}
            reason={screening.reasoning.skills}
            subAttributes={screening.subAttributes?.skills}
          />
          <Axis
            label="Experience Fit"
            score={screening.expFit}
            reason={screening.reasoning.experience}
            subAttributes={screening.subAttributes?.experience}
          />
          <Axis
            label="Culture Fit"
            score={screening.cultureFit}
            reason={screening.reasoning.culture}
            subAttributes={screening.subAttributes?.culture}
          />
        </div>
      </div>

      <div className="loga-card rounded-[var(--radius-card)] border bg-surface p-4">
        <h4 className="text-sm font-medium text-ink">สรุปสำหรับทีมสัมภาษณ์</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{screening.summary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {screening.strengths.length > 0 && (
          <section className="loga-card rounded-[var(--radius-card)] border bg-bg p-4">
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
          <section className="loga-card rounded-[var(--radius-card)] border bg-bg p-4">
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

      <p className="rounded-[var(--radius-card)] border border-border bg-surface-2 px-3 py-2 text-xs text-ink-3">
        ℹ️ คะแนนนี้เป็น <strong className="text-ink-2">ตัวช่วยจัดลำดับ</strong> ให้มนุษย์ตัดสิน — ไม่ใช่เกณฑ์ตัดอัตโนมัติ.
        ดู &ldquo;ความเชื่อมั่น&rdquo; ประกอบ และถ้าคะแนนก้ำกึ่ง ควรให้คนอ่าน CV เอง (ระบบให้คะแนนแบบ deterministic — CV เดิมได้คะแนนเดิมเสมอ).
      </p>
    </div>
  );
}
