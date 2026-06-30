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
  STAGE_LABELS,
  SOURCE_LABELS,
  SOURCES,
  type ApplicationWithRelations,
  type JobDescription,
  type Source,
  type Stage,
} from "@/lib/types";
import { BoardView } from "./board-view";
import { ListView } from "./list-view";
import { CandidateCard } from "./candidate-card";
import { updateStage } from "./actions";
import { EMPTY_FILTERS, type TrackerFilters, type TrackerView } from "./view-types";
import { TrackerProvider } from "./tracker-ctx";

interface TrackerBoardProps {
  initial: ApplicationWithRelations[];
  jobs: Pick<JobDescription, "id" | "title">[];
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
export function TrackerBoard({ initial, jobs }: TrackerBoardProps) {
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
      if (filters.stage && a.stage !== filters.stage) return false;
      if (filters.jobId && a.jobId !== filters.jobId) return false;
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
    const prevStage = apps.find((a) => a.id === id)?.stage;
    if (!prevStage || prevStage === overStage) return;

    // Optimistic move, then persist. Roll back if the write fails.
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage: overStage } : a)));
    updateStage({ applicationId: id, stage: overStage }).then((r) => {
      if (!r.ok) {
        setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage: prevStage } : a)));
      }
    });
  }

  function onDeleted(applicationId: string) {
    setApps((prev) => prev.filter((a) => a.id !== applicationId));
  }

  return (
    <TrackerProvider onDeleted={onDeleted}>
    <div className="space-y-4">
      <Toolbar
        view={view}
        onView={setView}
        filters={filters}
        onFilters={setFilters}
        total={filtered.length}
        jobs={jobs}
      />

      {filtered.length === 0 && apps.length > 0 ? (
        <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
          <p className="text-sm text-ink-2">ไม่พบผู้สมัครตามตัวกรองที่เลือก — ลองล้างคำค้นหาหรือเปลี่ยนแหล่งที่มา</p>
        </div>
      ) : view === "board" ? (
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
    </TrackerProvider>
  );
}

interface ToolbarProps {
  view: TrackerView;
  onView: (v: TrackerView) => void;
  filters: TrackerFilters;
  onFilters: (f: TrackerFilters) => void;
  total: number;
  jobs: Pick<JobDescription, "id" | "title">[];
}

function Toolbar({ view, onView, filters, onFilters, total, jobs }: ToolbarProps) {
  const hasFilter = filters.search || filters.source || filters.stage || filters.jobId;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={filters.search}
        onChange={(e) => onFilters({ ...filters, search: e.target.value })}
        placeholder="ค้นหาชื่อ / ตำแหน่ง…"
        className="field h-9 w-48 rounded-[var(--radius-card)] px-3 text-sm text-ink placeholder:text-ink-3"
      />

      <select
        value={filters.stage ?? ""}
        onChange={(e) => onFilters({ ...filters, stage: (e.target.value || null) as Stage | null })}
        className="field h-9 rounded-[var(--radius-card)] px-2.5 text-sm text-ink-2"
      >
        <option value="">ทุก Stage</option>
        {STAGES.map((s) => (
          <option key={s} value={s}>{STAGE_LABELS[s]}</option>
        ))}
      </select>

      <select
        value={filters.jobId ?? ""}
        onChange={(e) => onFilters({ ...filters, jobId: e.target.value || null })}
        className="field h-9 rounded-[var(--radius-card)] px-2.5 text-sm text-ink-2"
      >
        <option value="">ทุกตำแหน่ง</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>{j.title}</option>
        ))}
      </select>

      <select
        value={filters.source ?? ""}
        onChange={(e) =>
          onFilters({ ...filters, source: (e.target.value || null) as Source | null })
        }
        className="field h-9 rounded-[var(--radius-card)] px-2.5 text-sm text-ink-2"
      >
        <option value="">ทุกแหล่งที่มา</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
        ))}
      </select>

      {hasFilter && (
        <button
          type="button"
          onClick={() => onFilters({ search: "", source: null, stage: null, jobId: null })}
          className="text-xs text-ink-3 hover:text-ink underline"
        >
          ล้างตัวกรอง
        </button>
      )}

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
