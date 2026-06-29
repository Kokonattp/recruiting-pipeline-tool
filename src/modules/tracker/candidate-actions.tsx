"use client";

import { useState } from "react";
import type { Candidate } from "@/lib/types";
import { EditCandidateDialog } from "./add-candidate-dialog";
import { deleteCandidate } from "./actions";

/**
 * Per-card edit/delete affordance. Lives in its own client component so the card
 * itself can stay a server component. Edit opens the shared candidate dialog in
 * edit mode; delete confirms before removing (cascades to applications).
 */
export function CandidateActions({ candidate }: { candidate: Candidate }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(`ลบ "${candidate.name}" ออกจากระบบ?`)) return;
    setBusy(true);
    await deleteCandidate(candidate.id);
    setBusy(false);
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label="แก้ไขผู้สมัคร"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-ink-3 hover:bg-surface-2 hover:text-ink-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="ลบผู้สมัคร"
          disabled={busy}
          onClick={onDelete}
          className="rounded p-1 text-ink-3 hover:bg-danger-soft hover:text-[var(--danger)] disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>

      {editing && (
        <EditCandidateDialog candidate={candidate} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
