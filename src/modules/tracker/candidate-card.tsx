import { formatDistanceToNowStrict } from "date-fns";
import type { ApplicationWithRelations } from "@/lib/types";
import { ScoreChip } from "@/components/ui/score-chip";
import { SourcePill } from "@/components/ui/source-pill";
import { CandidateActions } from "./candidate-actions";

/** Initials for the avatar — handles Thai (no spaces) and Latin names. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface CandidateCardProps {
  application: ApplicationWithRelations;
  /** drag affordances injected by the board (dnd-kit) */
  dragHandle?: React.ReactNode;
}

export function CandidateCard({ application, dragHandle }: CandidateCardProps) {
  const { candidate, screening, appliedAt } = application;

  return (
    <article className="loga-card group rounded-[var(--radius-card)] border bg-bg p-3">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-ink"
        >
          {initials(candidate.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink">{candidate.name}</h3>
          {candidate.headline && (
            <p className="truncate text-xs text-ink-2">{candidate.headline}</p>
          )}
        </div>
        <CandidateActions candidate={candidate} />
        {dragHandle}
      </div>

      {screening && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          <ScoreChip label="Skills" score={screening.skillsFit} />
          <ScoreChip label="Exp" score={screening.expFit} />
          <ScoreChip label="Culture" score={screening.cultureFit} />
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <SourcePill source={candidate.source} />
        <time
          className="text-[11px] text-ink-3"
          dateTime={appliedAt}
          title={new Date(appliedAt).toLocaleString()}
        >
          {formatDistanceToNowStrict(new Date(appliedAt), { addSuffix: true })}
        </time>
      </div>
    </article>
  );
}
