"use client";

import { useState } from "react";
import { SOURCE_LABELS, SOURCES, type JobDescription, type Source } from "@/lib/types";
import { addCandidate } from "./actions";

/**
 * Add a candidate by hand (referral / direct applicant). Uses the native <dialog>
 * element so it escapes any stacking context and is accessible by default. On success
 * the page revalidates (the action calls revalidatePath), so the board updates.
 */
export function AddCandidateDialog({ jobs }: { jobs: JobDescription[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "REFERRAL" as Source,
    jobId: jobs[0]?.id ?? "",
  });

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await addCandidate(form);
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      setForm({ ...form, name: "", email: "", phone: "" });
    } else setError(r.error);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-[var(--radius-card)] bg-primary px-4 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90"
      >
        + เพิ่มผู้สมัคร
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-lg">
            <h2 className="text-base font-semibold text-ink">เพิ่มผู้สมัคร</h2>

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
              <Select
                label="ตำแหน่งที่สมัคร"
                value={form.jobId}
                onChange={(v) => setForm({ ...form, jobId: v })}
                options={jobs.map((j) => ({ value: j.id, label: j.title }))}
              />
            </div>

            {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 hover:bg-surface-2"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={busy || !form.name.trim() || !form.jobId}
                onClick={submit}
                className="h-9 rounded-[var(--radius-card)] bg-primary px-4 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm text-ink focus:border-primary focus:outline-none"
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
        className="h-9 w-full rounded-[var(--radius-card)] border border-border bg-bg px-2.5 text-sm text-ink focus:border-primary focus:outline-none"
      >
        {options.length === 0 && <option value="">— ยังไม่มีตำแหน่ง —</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
