"use client";

import { useState } from "react";
import Link from "next/link";
import type { Candidate } from "@/lib/types";
import { EditCandidateDialog } from "./add-candidate-dialog";
import { deleteCandidate } from "./actions";
import { Toast } from "@/components/ui/toast";

/**
 * Per-card screen/edit/delete affordance. Lives in its own client component so the card
 * itself can stay a server component. "คัดกรอง" jumps to Module 2 pre-selecting this
 * candidate + their job, so HR only has to attach the CV. Edit opens the shared dialog;
 * delete confirms before removing (cascades to applications).
 */
export function CandidateActions({ candidate, jobId }: { candidate: Candidate; jobId?: string }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm(`ลบ "${candidate.name}" ออกจากระบบ?`)) return;
    setBusy(true);
    await deleteCandidate(candidate.id);
    setBusy(false);
    setToast(`ลบ "${candidate.name}" แล้ว`);
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/screener?cand=${candidate.id}${jobId ? `&job=${jobId}` : ""}`}
          aria-label="คัดกรอง CV"
          title="คัดกรอง CV ด้วย AI"
          className="rounded p-1 text-ink-3 hover:bg-surface-2 hover:text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13l2 2 4-4" />
          </svg>
        </Link>
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
        <EditCandidateDialog
          candidate={candidate}
          onClose={(success) => {
            setEditing(false);
            if (success) setToast("บันทึกการแก้ไขแล้ว ✓");
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
