import { scoreBand } from "@/lib/types";

// Outlined pill colored by band (LOGA-style) — value + border share the band color
// so strong/weak candidates pop when scanning a column.
const BAND_CLASS: Record<"low" | "mid" | "high", string> = {
  low: "text-[var(--score-low)] border-[var(--score-low)]",
  mid: "text-[var(--score-mid)] border-[var(--score-mid)]",
  high: "text-[var(--score-high)] border-[var(--score-high)]",
};

interface ScoreChipProps {
  label: string; // e.g. "Skills"
  score: number; // 0-10
}

/**
 * Compact AI-score indicator: a short label + the value, colored by band
 * (red ≤4 / amber 5-7 / green 8-10). Color carries meaning, not decoration —
 * HR scans a column and the strong/weak candidates pop without reading numbers.
 */
export function ScoreChip({ label, score }: ScoreChipProps) {
  const band = scoreBand(score);
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-md border bg-bg px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${BAND_CLASS[band]}`}
      title={`${label} fit: ${score}/10`}
    >
      <span className="text-ink-3">{label}</span>
      {score}
    </span>
  );
}
