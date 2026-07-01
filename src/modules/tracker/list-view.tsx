import { formatDistanceToNowStrict } from "date-fns";
import {
  STAGE_HUE,
  STAGE_LABELS,
  scoreBand,
  type ApplicationWithRelations,
} from "@/lib/types";
import { SourcePill } from "@/components/ui/source-pill";
import { ScreeningDetailButton } from "./screening-detail-dialog";

const BAND_TEXT: Record<"low" | "mid" | "high", string> = {
  low: "text-[var(--score-low)]",
  mid: "text-[var(--score-mid)]",
  high: "text-[var(--score-high)]",
};

function Score({ value }: { value: number }) {
  return (
    <span className={`tabular-nums font-medium ${BAND_TEXT[scoreBand(value)]}`}>{value}</span>
  );
}

/** Dense table view — more candidates per screen than the board, sortable mental model by column. */
export function ListView({ applications }: { applications: ApplicationWithRelations[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-left text-xs font-medium text-ink-2">
            <th className="px-3 py-2.5 font-medium">Candidate</th>
            <th className="px-3 py-2.5 font-medium">Stage</th>
            <th className="px-3 py-2.5 text-center font-medium" title="Skills fit">Skills</th>
            <th className="px-3 py-2.5 text-center font-medium" title="Experience fit">Exp</th>
            <th className="px-3 py-2.5 text-center font-medium" title="Culture fit">Culture</th>
            <th className="px-3 py-2.5 font-medium">Source</th>
            <th className="px-3 py-2.5 font-medium">Applied</th>
            <th className="px-3 py-2.5 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border last:border-0 hover:bg-surface-2">
              <td className="px-3 py-2.5">
                <div className="font-medium text-ink">{app.candidate.name}</div>
                {app.candidate.headline && (
                  <div className="truncate text-xs text-ink-3">{app.candidate.headline}</div>
                )}
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-ink-2">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: `oklch(0.62 0.16 ${STAGE_HUE[app.stage]})` }}
                  />
                  {STAGE_LABELS[app.stage]}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center">
                {app.screening ? <Score value={app.screening.skillsFit} /> : <span className="text-ink-3">—</span>}
              </td>
              <td className="px-3 py-2.5 text-center">
                {app.screening ? <Score value={app.screening.expFit} /> : <span className="text-ink-3">—</span>}
              </td>
              <td className="px-3 py-2.5 text-center">
                {app.screening ? <Score value={app.screening.cultureFit} /> : <span className="text-ink-3">—</span>}
              </td>
              <td className="px-3 py-2.5"><SourcePill source={app.candidate.source} /></td>
              <td className="px-3 py-2.5 text-ink-2">
                {formatDistanceToNowStrict(new Date(app.appliedAt), { addSuffix: true })}
              </td>
              <td className="px-3 py-2.5">
                {app.screening ? (
                  <ScreeningDetailButton
                    screening={app.screening}
                    candidateName={app.candidate.name}
                    jobTitle={app.job.title}
                  />
                ) : (
                  <a
                    href={`/screener?cand=${app.candidate.id}&job=${app.job.id}`}
                    className="whitespace-nowrap text-xs font-medium text-ink-3 hover:text-primary hover:underline"
                  >
                    คัดกรองเลย →
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
