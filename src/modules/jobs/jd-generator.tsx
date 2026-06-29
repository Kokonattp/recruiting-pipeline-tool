"use client";

import { useState } from "react";
import { generateJobDescription, saveJobDescription } from "./actions";
import type { GeneratedJD } from "./ai";

/**
 * JD Generator: HR types keywords → Claude expands into a full JD → HR reviews →
 * saves as a job_description. The saved job then powers sourcing + screening.
 * onSaved lets the parent (sourcing page) refresh its JD list / select the new one.
 */
export function JDGenerator({ onSaved }: { onSaved?: (jobId: string) => void }) {
  const [keywords, setKeywords] = useState("");
  const [jd, setJd] = useState<GeneratedJD | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Patch one field of the draft JD (used by the edit form). */
  function patch(p: Partial<GeneratedJD>) {
    setJd((prev) => (prev ? { ...prev, ...p } : prev));
  }

  async function onGenerate() {
    setBusy(true);
    setError(null);
    setEditing(false);
    const r = await generateJobDescription({ keywords });
    setBusy(false);
    if (r.ok) setJd(r.jd);
    else setError(r.error);
  }

  async function onSave() {
    if (!jd) return;
    setSaving(true);
    const r = await saveJobDescription(jd);
    setSaving(false);
    if (r.ok) {
      onSaved?.(r.jobId);
      setJd(null);
      setKeywords("");
    } else setError(r.error);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          คีย์เวิร์ดตำแหน่ง
        </label>
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="เช่น Senior AI Engineer, Python, LangChain, 5 ปี, กรุงเทพ"
          className="h-10 w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--danger)] bg-danger-soft px-3 py-2 text-sm text-ink">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={busy || keywords.trim().length < 5}
        onClick={onGenerate}
        className="h-10 rounded-[var(--radius-card)] bg-primary px-5 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "AI กำลังสร้าง JD…" : "สร้าง Job Description ด้วย AI"}
      </button>

      {jd && (
        <div className="space-y-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs text-ink-3">
              {editing ? "แก้ไขก่อนบันทึก — AI ร่างให้ HR ปรับได้ทุกช่อง" : "ตรวจทาน JD ที่ AI ร่าง ก่อนบันทึก"}
            </p>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {editing ? "เสร็จสิ้นการแก้ไข" : "✎ แก้ไข"}
            </button>
          </div>

          {editing ? (
            <JDEditForm jd={jd} patch={patch} />
          ) : (
            <>
              <div>
                <h3 className="text-base font-semibold text-ink">{jd.title}</h3>
                <p className="text-xs text-ink-3">
                  {jd.department} · {jd.seniority}
                </p>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{jd.summary}</p>

              <Section title="หน้าที่หลัก" items={jd.responsibilities} />
              <Section title="ทักษะที่ต้องมี" items={jd.requiredSkills} pill />
              <Section title="จะดีมากถ้ามี" items={jd.niceToHave} pill />
            </>
          )}

          <button
            type="button"
            disabled={saving || !jd.title.trim()}
            onClick={onSave}
            className="h-9 rounded-[var(--radius-card)] bg-primary px-4 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "กำลังบันทึก…" : "บันทึกตำแหน่งนี้"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Inline edit form for the AI-drafted JD. HR edits the structured fields directly;
 * list fields (responsibilities/skills) are edited as one-per-line text and parsed
 * back to arrays on change, so the saved JD reflects exactly what HR approved.
 */
function JDEditForm({ jd, patch }: { jd: GeneratedJD; patch: (p: Partial<GeneratedJD>) => void }) {
  const toLines = (arr: string[]) => arr.join("\n");
  const fromLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="ชื่อตำแหน่ง" value={jd.title} onChange={(v) => patch({ title: v })} />
        <Field label="แผนก" value={jd.department} onChange={(v) => patch({ department: v })} />
        <Field label="ระดับ" value={jd.seniority} onChange={(v) => patch({ seniority: v })} />
      </div>
      <Area label="สรุปตำแหน่ง" value={jd.summary} rows={3} onChange={(v) => patch({ summary: v })} />
      <Area
        label="หน้าที่หลัก (บรรทัดละ 1 ข้อ)"
        value={toLines(jd.responsibilities)}
        rows={4}
        onChange={(v) => patch({ responsibilities: fromLines(v) })}
      />
      <Area
        label="ทักษะที่ต้องมี (บรรทัดละ 1 ข้อ)"
        value={toLines(jd.requiredSkills)}
        rows={3}
        onChange={(v) => patch({ requiredSkills: fromLines(v) })}
      />
      <Area
        label="จะดีมากถ้ามี (บรรทัดละ 1 ข้อ)"
        value={toLines(jd.niceToHave)}
        rows={2}
        onChange={(v) => patch({ niceToHave: fromLines(v) })}
      />
      <Area
        label="JD ฉบับเต็ม (ข้อความที่จะบันทึก)"
        value={jd.rawText}
        rows={6}
        onChange={(v) => patch({ rawText: v })}
      />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[var(--radius-card)] border border-border bg-bg px-2.5 text-sm text-ink focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function Area({ label, value, rows, onChange }: { label: string; value: string; rows: number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius-card)] border border-border bg-bg p-2.5 text-sm text-ink focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function Section({ title, items, pill }: { title: string; items: string[]; pill?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-medium text-ink-2">{title}</h4>
      {pill ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s, i) => (
            <span key={i} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-ink-2">
              {s}
            </span>
          ))}
        </div>
      ) : (
        <ul className="list-inside list-disc space-y-0.5 text-sm text-ink-2">
          {items.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
