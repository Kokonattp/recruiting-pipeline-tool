"use client";

import { useState } from "react";
import type { JobDescription } from "@/lib/types";
import type { GeneratedJD } from "./ai";
import { deleteJobDescription, updateJobDescription } from "./actions";
import { generateJobPoster } from "./poster-actions";

function toGeneratedJD(job: JobDescription): GeneratedJD {
  return {
    title: job.title,
    department: job.department ?? "",
    seniority: job.seniority ?? "",
    summary: "",
    responsibilities: [],
    requiredSkills: job.requiredSkills,
    niceToHave: job.niceToHave,
    rawText: job.rawText,
  };
}

export function JDManager({ jobs, onRefresh }: { jobs: JobDescription[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GeneratedJD>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // Set-based so multiple jobs can generate poster simultaneously without clobbering each other
  const [posterBusy, setPosterBusy] = useState<Set<string>>(new Set());
  const [posters, setPosters] = useState<Record<string, string>>({}); // jobId → base64
  const [error, setError] = useState<string | null>(null);

  function startEdit(job: JobDescription) {
    setDrafts((prev) => ({ ...prev, [job.id]: toGeneratedJD(job) }));
    setEditing(job.id);
    setError(null);
  }

  function patch(id: string, p: Partial<GeneratedJD>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }

  async function onSave(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setBusy(id);
    const r = await updateJobDescription(id, draft);
    setBusy(null);
    if (r.ok) { setEditing(null); onRefresh(); }
    else setError(r.error);
  }

  async function onPoster(job: JobDescription) {
    setPosterBusy((prev) => new Set(prev).add(job.id));
    setError(null);
    const r = await generateJobPoster(toGeneratedJD(job));
    setPosterBusy((prev) => { const s = new Set(prev); s.delete(job.id); return s; });
    if (r.ok) setPosters((prev) => ({ ...prev, [job.id]: r.base64 }));
    else setError(r.error);
  }

  async function onDelete(job: JobDescription) {
    if (!window.confirm(`ลบตำแหน่ง "${job.title}" ออกจากระบบ? (ผู้สมัครที่ผูกกับตำแหน่งนี้จะถูกลบด้วย)`)) return;
    setBusy(job.id);
    const r = await deleteJobDescription(job.id);
    setBusy(null);
    if (r.ok) onRefresh();
    else setError(r.error);
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-ink-3">ยังไม่มีตำแหน่งงานที่บันทึกไว้ — สร้างจาก tab "สร้างตำแหน่ง (JD)"</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--danger)] bg-danger-soft px-3 py-2 text-sm text-ink">{error}</div>
      )}

      {jobs.map((job) => {
        const isEditing = editing === job.id;
        const draft = drafts[job.id];
        const isBusy = busy === job.id;

        return (
          <div key={job.id} className={["loga-card rounded-[var(--radius-card)] border-2 p-4 space-y-3", isEditing ? "border-ink" : "border-border"].join(" ")}>
            {isEditing && draft ? (
              <>
                {/* ชื่อตำแหน่งกว้างกว่า — col-span-2, แผนก+ระดับแบ่ง 1 */}
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <EditField label="ชื่อตำแหน่ง" value={draft.title} onChange={(v) => patch(job.id, { title: v })} />
                  <EditField label="แผนก" value={draft.department} onChange={(v) => patch(job.id, { department: v })} />
                  <EditField label="ระดับ" value={draft.seniority} onChange={(v) => patch(job.id, { seniority: v })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditArea
                    label="ทักษะที่ต้องมี (บรรทัดละ 1 ข้อ)"
                    value={draft.requiredSkills.join("\n")}
                    onChange={(v) => patch(job.id, { requiredSkills: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
                  />
                  <EditArea
                    label="จะดีมากถ้ามี (บรรทัดละ 1 ข้อ)"
                    value={draft.niceToHave.join("\n")}
                    onChange={(v) => patch(job.id, { niceToHave: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <EditArea
                  label="JD ฉบับเต็ม"
                  value={draft.rawText}
                  onChange={(v) => patch(job.id, { rawText: v })}
                  tall
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isBusy || !draft.title.trim()}
                    onClick={() => onSave(job.id)}
                    className="h-9 rounded-[var(--radius-card)] btn-primary px-5 text-sm font-semibold disabled:opacity-40"
                  >
                    {isBusy ? "กำลังบันทึก…" : "บันทึก"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="h-9 rounded-[var(--radius-card)] border-2 border-border px-4 text-sm font-semibold text-ink-2 hover:border-ink hover:bg-surface-2"
                  >
                    ยกเลิก
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{job.title}</p>
                    <p className="text-xs text-ink-3 mt-0.5">
                      {[job.department, job.seniority].filter(Boolean).join(" · ")}
                      {" · "}
                      {new Date(job.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </p>
                    {job.requiredSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.requiredSkills.slice(0, 5).map((s) => (
                          <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-ink-2">{s}</span>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <span className="text-xs text-ink-3">+{job.requiredSkills.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title="สร้างรูปประกาศ (AI)"
                      disabled={posterBusy.has(job.id)}
                      onClick={() => onPoster(job)}
                      className="rounded p-1.5 text-ink-3 hover:bg-surface-2 hover:text-primary disabled:opacity-40"
                    >
                      {posterBusy.has(job.id)
                        ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 15 5-5 4 4 3-3 4 4"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                      }
                    </button>
                    <button
                      type="button"
                      title="แก้ไข JD"
                      onClick={() => startEdit(job)}
                      className="rounded p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="ลบตำแหน่งนี้"
                      disabled={isBusy}
                      onClick={() => onDelete(job)}
                      className="rounded p-1.5 text-ink-3 hover:bg-danger-soft hover:text-[var(--danger)] disabled:opacity-40"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {posterBusy.has(job.id) && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
                      <p className="text-xs font-medium text-ink-2">AI กำลังสร้างรูปประกาศ… (~20–30 วิ)</p>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full w-1/3 animate-pulse rounded-full bg-primary opacity-70" />
                    </div>
                  </div>
                )}

                {!posterBusy.has(job.id) && posters[job.id] && (
                  <div className="space-y-2 border-t border-border pt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${posters[job.id]}`}
                      alt={`รูปประกาศ: ${job.title}`}
                      className="mx-auto w-full max-w-xs rounded-[var(--radius-card)] border-2 border-border"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-ink-3">⚠️ ข้อความบนรูป AI อาจไม่ถูกต้อง — ใช้เป็นภาพประกอบ</p>
                      <div className="flex gap-2">
                        <a
                          href={`data:image/png;base64,${posters[job.id]}`}
                          download={`hiring-${job.title.replace(/\s+/g, "-")}.png`}
                          className="shrink-0 text-xs font-semibold text-primary hover:underline"
                        >
                          ดาวน์โหลด
                        </a>
                        <button
                          type="button"
                          onClick={() => onPoster(job)}
                          disabled={posterBusy.has(job.id)}
                          className="shrink-0 text-xs font-semibold text-ink-3 hover:text-ink disabled:opacity-40"
                        >
                          สร้างใหม่
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[var(--radius-card)] field px-2.5 text-sm text-ink"
      />
    </label>
  );
}

function EditArea({ label, value, onChange, tall }: { label: string; value: string; onChange: (v: string) => void; tall?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      <textarea
        value={value}
        rows={tall ? 8 : 4}
        ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
        onChange={(e) => { onChange(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; }}
        className="w-full resize-none overflow-hidden rounded-[var(--radius-card)] field p-2.5 text-sm text-ink"
      />
    </label>
  );
}
