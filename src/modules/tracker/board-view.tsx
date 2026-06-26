import { PIPELINE_STAGES, type Stage } from "@/lib/types";
import type { ApplicationWithRelations } from "@/lib/types";
import { StageColumn } from "./stage-column";

interface BoardViewProps {
  byStage: Record<Stage, ApplicationWithRelations[]>;
}

/**
 * Kanban board. Active pipeline stages are columns (Applied → Offer); the terminal
 * states (Hired / Rejected) sit in a compact rail on the right so they don't dominate
 * the active funnel but stay visible.
 */
export function BoardView({ byStage }: BoardViewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => (
        <StageColumn key={stage} stage={stage} applications={byStage[stage]} />
      ))}

      <div className="flex w-72 shrink-0 flex-col gap-4">
        <StageColumn stage="HIRED" applications={byStage.HIRED} />
        <StageColumn stage="REJECTED" applications={byStage.REJECTED} />
      </div>
    </div>
  );
}
