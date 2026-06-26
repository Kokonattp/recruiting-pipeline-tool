"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  STAGES,
  SOURCE_LABELS,
  SOURCES,
  type ApplicationWithRelations,
  type Source,
  type Stage,
} from "@/lib/types";
import { BoardView } from "./board-view";
import { ListView } from "./list-view";
import { CandidateCard } from "./candidate-card";
import { EMPTY_FILTERS, type TrackerFilters, type TrackerView } from "./view-types";

interface TrackerBoardProps {
  initial: ApplicationWithRelations[];
}

function emptyByStage(): Record<Stage, ApplicationWithRelations[]> {
  const acc = {} as Record<Stage, ApplicationWithRelations[]>;
  for (const s of STAGES) acc[s] = [];
  return acc;
}

/**
 * Client container for the Tracker: owns view (board/list), filters, and optimistic
 * drag-to-restage. Stage moves are local-only for now; Phase B wires `updateStage`
 * (Server Action) so the move persists to Supabase.
 */
export function TrackerBoard({ initial }: TrackerBoardProps) {
  const [apps, setApps] = useState(initial);
  const [view, setView] = useState<TrackerView>("board");
  const [filters, setFilters] = useState<TrackerFilters>(EMPTY_FILTERS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return apps.filter((a) => {
      if (filters.source && a.candidate.source !== filters.source) return false;
      if (q) {
        const hay = `${a.candidate.name} ${a.candidate.headline ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, filters]);

  const byStage = useMemo(() => {
    const grouped = emptyByStage();
    for (const a of filtered) grouped[a.stage].push(a);
    return grouped;
  }, [filtered]);

  const activeApp = activeId ? apps.find((a) => a.id === activeId) ?? null : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overStage = e.over?.id as Stage | undefined;
    if (!overStage) return;
    const id = String(e.active.id);
    setApps((prev) =>
      prev.map((a) => (a.id === id && a.stage !== overStage ? { ...a, stage: overStage } : a)),
    );
    // TODO(phase B): await updateStage(id, overStage) — persist to Supabase
  }

  return (
    <div className="space-y-4">
      <Toolbar
        view={view}
        onView={setView}
        filters={filters}
        onFilters={setFilters}
        total={filtered.length}
      />

      {view === "board" ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <BoardView byStage={byStage} />
          <DragOverlay>
            {activeApp ? (
              <div className="w-72 rotate-2">
                <CandidateCard application={activeApp} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <ListView applications={filtered} />
      )}
    </div>
  );
}

interface ToolbarProps {
  view: TrackerView;
  onView: (v: TrackerView) => void;
  filters: TrackerFilters;
  onFilters: (f: TrackerFilters) => void;
  total: number;
}

function Toolbar({ view, onView, filters, onFilters, total }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={filters.search}
        onChange={(e) => onFilters({ ...filters, search: e.target.value })}
        placeholder="ค้นหาชื่อ / ตำแหน่ง…"
        className="h-9 w-56 rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none"
      />

      <select
        value={filters.source ?? ""}
        onChange={(e) =>
          onFilters({ ...filters, source: (e.target.value || null) as Source | null })
        }
        className="h-9 rounded-[var(--radius-card)] border border-border bg-bg px-2.5 text-sm text-ink-2 focus:border-primary focus:outline-none"
      >
        <option value="">ทุกแหล่งที่มา</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
        ))}
      </select>

      <span className="text-sm text-ink-3">{total} ผู้สมัคร</span>

      {/* view toggle */}
      <div className="ml-auto inline-flex rounded-[var(--radius-card)] border border-border p-0.5">
        {(["board", "list"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onView(v)}
            aria-pressed={view === v}
            className={[
              "rounded-[calc(var(--radius-card)-2px)] px-3 py-1 text-sm font-medium transition-colors",
              view === v ? "bg-primary text-primary-ink" : "text-ink-2 hover:text-ink",
            ].join(" ")}
          >
            {v === "board" ? "Board" : "List"}
          </button>
        ))}
      </div>
    </div>
  );
}
