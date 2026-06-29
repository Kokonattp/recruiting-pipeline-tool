import { SOURCE_LABELS, type Source } from "@/lib/types";

/**
 * Where a candidate came from. Each source carries a subtle hue so HR can scan
 * provenance at a glance (LinkedIn-blue, JobsDB-teal, etc.) without it shouting —
 * a tinted pill, not a saturated badge.
 */
const SOURCE_HUE: Record<Source, number> = {
  LINKEDIN: 240,
  JOBSDB: 200,
  JOBBKK: 280,
  JOBTHAI: 160,
  FACEBOOK: 250,
  WEB: 70,
  REFERRAL: 150,
  MANUAL: 300,
};

export function SourcePill({ source }: { source: Source }) {
  const h = SOURCE_HUE[source];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
      style={{
        background: `oklch(0.6 0.15 ${h} / 0.12)`,
        color: `oklch(0.48 0.15 ${h})`,
      }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: `oklch(0.6 0.15 ${h})` }} />
      {SOURCE_LABELS[source]}
    </span>
  );
}
