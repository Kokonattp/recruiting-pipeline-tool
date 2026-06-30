"use client";

import { useState } from "react";
import {
  SOURCE_LABELS,
  SOURCES,
  type Candidate,
  type JobDescription,
  type Source,
} from "@/lib/types";
import { addCandidate, editCandidate } from "./actions";

/**
 * Add a candidate by hand (referral / direct applicant). Uses a centered overlay
 * dialog. On success the page revalidates (the action calls revalidatePath), so the
 * board updates.
 */
export function AddCandidateDialog({ jobs }: { jobs: JobDescription[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-[var(--radius-card)] btn-primary px-4 text-sm font-semibold"
      >
        + เพิ่มผู้สมัคร
      </button>
      {open && <CandidateForm mode="add" jobs={jobs} onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * Edit an existing candidate's details (name / email / phone / source). Controlled by
 * the parent (the card opens it); the job/stage are not edited here — moving stage is
 * the board's job, and re-assigning a job is a separate flow.
 */
export function EditCandidateDialog({
  candidate,
  onClose,
}: {
  candidate: Candidate;
  onClose: () => void;
}) {
  return <CandidateForm mode="edit" candidate={candidate} onClose={onClose} />;
}

type FormProps =
  | { mode: "add"; jobs: JobDescription[]; onClose: () => void; candidate?: undefined }
  | { mode: "edit"; candidate: Candidate; onClose: () => void; jobs?: undefined };

function CandidateForm({ mode, jobs, candidate, onClose }: FormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: candidate?.name ?? "",
    email: candidate?.email ?? "",
    phone: candidate?.phone ?? "",
    source: (candidate?.source ?? "REFERRAL") as Source,
    jobId: jobs?.[0]?.id ?? "",
  });

  async function submit() {
    setBusy(true);
    setError(null);
    const r =
      mode === "add"
        ? await addCandidate(form)
        : await editCandidate({
            candidateId: candidate.id,
            name: form.name,
            email: form.email,
            phone: form.phone,
            source: form.source,
          });
    setBusy(false);
    if (r.ok) onClose();
    else setError(r.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="loga-card w-full max-w-md rounded-[var(--radius-card)] border bg-bg p-5">
        <h2 className="text-base font-semibold text-ink">
          {mode === "add" ? "เพิ่มผู้สมัคร" : "แก้ไขผู้สมัคร"}
        </h2>

        <div className="mt-4 space-y-3">
          <Input label="ชื่อ-นามสกุล" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="อีเมล" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="เบอร์โทร" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />

          <Select
            label="แหล่งที่มา"
            value={form.source}
            onChange={(v) => setForm({ ...form, source: v as Source })}
            options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
          />
          {mode === "add" && (
            <Select
              label="ตำแหน่งที่สมัคร"
              value={form.jobId}
              onChange={(v) => setForm({ ...form, jobId: v })}
              options={jobs.map((j) => ({ value: j.id, label: j.title }))}
            />
          )}
        </div>

        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 hover:bg-surface-2"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={busy || !form.name.trim() || (mode === "add" && !form.jobId)}
            onClick={submit}
            className="h-9 rounded-[var(--radius-card)] btn-primary px-4 text-sm font-semibold"
          >
            {busy ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[var(--radius-card)] field px-3 text-sm text-ink "
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[var(--radius-card)] field px-2.5 text-sm text-ink "
      >
        {options.length === 0 && <option value="">— ยังไม่มีตำแหน่ง —</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
