import { useDroppable } from "@dnd-kit/core";
import { STAGE_HUE, STAGE_LABELS, type Stage } from "@/lib/types";
import type { ApplicationWithRelations } from "@/lib/types";
import { DraggableCard } from "./draggable-card";

interface StageColumnProps {
  stage: Stage;
  applications: ApplicationWithRelations[];
}

/** One pipeline column. Header carries the stage's hue + live count; body is a drop target. */
export function StageColumn({ stage, applications }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const hue = STAGE_HUE[stage];

  return (
    <section className="flex w-72 shrink-0 flex-col">
      {/* LOGA-style header: stage color as a leading bar + bold title + accent count */}
      <header className="mb-2 flex items-center gap-2 px-1">
        <span
          aria-hidden
          className="h-4 w-1 rounded-full"
          style={{ background: `oklch(0.6 0.18 ${hue})` }}
        />
        <h2 className="text-sm font-bold text-ink">{STAGE_LABELS[stage]}</h2>
        <span
          className="ml-auto text-sm font-bold tabular-nums"
          style={{ color: `oklch(0.6 0.18 ${hue})` }}
        >
          {applications.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={[
          "flex min-h-24 flex-1 flex-col gap-2 rounded-[var(--radius-card)] p-2 transition-colors",
          isOver ? "bg-primary-soft" : "bg-surface-2",
        ].join(" ")}
      >
        {applications.map((app) => (
          <DraggableCard key={app.id} application={app} />
        ))}
        {applications.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-ink-3">— ว่าง —</p>
        )}
      </div>
    </section>
  );
}
