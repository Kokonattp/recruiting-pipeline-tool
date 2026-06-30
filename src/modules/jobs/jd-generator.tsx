"use client";

import { useState } from "react";
import { generateJobDescription, saveJobDescription } from "./actions";
import { generateJobPoster } from "./poster-actions";
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
  const [poster, setPoster] = useState<string | null>(null);
  const [posterBusy, setPosterBusy] = useState(false);

  async function onPoster() {
    if (!jd) return;
    setPosterBusy(true);
    setError(null);
    const r = await generateJobPoster(jd);
    setPosterBusy(false);
    if (r.ok) setPoster(`data:image/png;base64,${r.base64}`);
    else setError(r.error);
  }

  /** Patch one field of the draft JD (used by the edit form). */
  function patch(p: Partial<GeneratedJD>) {
    setJd((prev) => (prev ? { ...prev, ...p } : prev));
  }

  async function onGenerate() {
    setBusy(true);
    setError(null);
    setEditing(false);
    setPoster(null);
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
          className="h-10 w-full rounded-[var(--radius-card)] field px-3 text-sm text-ink placeholder:text-ink-3 "
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
        className="h-10 rounded-[var(--radius-card)] btn-primary px-5 text-sm font-semibold"
      >
        {busy ? "AI กำลังสร้าง JD…" : "สร้าง Job Description ด้วย AI"}
      </button>

      {jd && (
        <div className="loga-card space-y-3 rounded-[var(--radius-card)] border bg-surface p-4">
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving || !jd.title.trim()}
              onClick={onSave}
              className="h-9 rounded-[var(--radius-card)] btn-primary px-4 text-sm font-semibold"
            >
              {saving ? "กำลังบันทึก…" : "บันทึกตำแหน่งนี้"}
            </button>
            <button
              type="button"
              disabled={posterBusy || !jd.title.trim()}
              onClick={onPoster}
              className="h-9 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              {posterBusy ? "AI กำลังสร้างรูป…" : "🖼️ สร้างรูปประกาศ (AI)"}
            </button>
          </div>

          {poster && (
            <div className="space-y-2 border-t border-border pt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster}
                alt={`รูปประกาศรับสมัคร: ${jd.title}`}
                className="mx-auto w-full max-w-sm rounded-[var(--radius-card)] border border-border"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-3">
                  ⚠️ ข้อความบนรูปที่ AI สร้างอาจไม่ถูกต้อง (โดยเฉพาะภาษาไทย) — ใช้เป็นภาพประกอบ, ยึด JD ที่บันทึกเป็นหลัก
                </p>
                <a
                  href={poster}
                  download={`hiring-${jd.title.replace(/\s+/g, "-")}.png`}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  ดาวน์โหลด
                </a>
              </div>
            </div>
          )}
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
        className="h-9 w-full rounded-[var(--radius-card)] field px-2.5 text-sm text-ink "
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
        className="w-full rounded-[var(--radius-card)] field p-2.5 text-sm text-ink "
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
