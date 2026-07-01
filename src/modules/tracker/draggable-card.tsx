import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ApplicationWithRelations } from "@/lib/types";
import { CandidateCard } from "./candidate-card";

/** Wraps CandidateCard with a drag handle so HR can move candidates between stages. */
export function DraggableCard({ application }: { application: ApplicationWithRelations }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={[
        "cursor-grab touch-none active:cursor-grabbing",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
      {...listeners}
      {...attributes}
    >
      <CandidateCard
        application={application}
        dragHandle={
          <span
            aria-hidden
            title="ลากการ์ดนี้เพื่อย้าย stage"
            className="shrink-0 rounded p-1 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
            </svg>
          </span>
        }
      />
    </div>
  );
}
