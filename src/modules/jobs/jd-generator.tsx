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
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setBusy(true);
    setError(null);
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
          <div>
            <h3 className="text-base font-semibold text-ink">{jd.title}</h3>
            <p className="text-xs text-ink-3">
              {jd.department} · {jd.seniority}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-ink-2">{jd.summary}</p>

          <Section title="หน้าที่หลัก" items={jd.responsibilities} />
          <Section title="ทักษะที่ต้องมี" items={jd.requiredSkills} pill />
          <Section title="จะดีมากถ้ามี" items={jd.niceToHave} pill />

          <button
            type="button"
            disabled={saving}
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
