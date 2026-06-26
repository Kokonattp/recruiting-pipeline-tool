import { SOURCE_LABELS, type Source } from "@/lib/types";

/** Where a candidate came from. Muted on purpose — provenance, not a primary signal. */
export function SourcePill({ source }: { source: Source }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
      {SOURCE_LABELS[source]}
    </span>
  );
}
