"use client";

import { useRef, useState } from "react";
import type { JobDescription } from "@/lib/types";
import { importPdfsAndRank, approveCandidates } from "./actions";
import type { RankResult } from "./types";

export function PdfImport({ jobs }: { jobs: JobDescription[] }) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [jdText, setJdText] = useState(jobs[0]?.rawText ?? "");
  const [files, setFiles] = useState<{ name: string; base64: string }[]>([]);
  const [result, setResult] = useState<RankResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approveMsg, setApproveMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickJob(id: string) {
    setJobId(id);
    const j = jobs.find((x) => x.id === id);
    if (j) setJdText(j.rawText);
  }

  async function onFiles(picked: FileList) {
    const pdfs = await Promise.all(
      Array.from(picked)
        .filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"))
        .map(async (f) => {
          const buf = await f.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          return { name: f.name, base64: btoa(binary) };
        }),
    );
    setFiles((prev) => {
      const names = new Set(prev.map((p) => p.name));
      return [...prev, ...pdfs.filter((p) => !names.has(p.name))];
    });
    setResult(null);
    setSelected(new Set());
    setError(null);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function onRank() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await importPdfsAndRank({ jdText, pdfs: files });
      if (r.ok) {
        setResult(r.data);
        setSelected(new Set(r.data.shortlist.map((_, i) => i)));
      } else {
        setError(r.error);
      }
    } catch {
      // Server Action threw before resolving (e.g. function timeout on a large batch
      // of PDFs) — without this, busy never resets and the button spins forever.
      setError("จัดอันดับไม่สำเร็จ (เซิร์ฟเวอร์ใช้เวลานานเกินไปหรือผิดพลาด) ลองไฟล์น้อยลงหรือลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function onApprove() {
    if (!result || selected.size === 0) return;
    if (!jobId) { setError("เลือกตำแหน่งก่อน"); return; }
    setApproving(true);
    const chosen = result.shortlist.filter((_, i) => selected.has(i));
    try {
      const r = await approveCandidates({ jobId, selected: chosen });
      if (!r.ok) setError(r.error);
      else setApproveMsg(`เพิ่ม ${chosen.length} คนเข้า Tracker เรียบร้อย ✓`);
    } catch {
      setError("อนุมัติไม่สำเร็จ (เซิร์ฟเวอร์ผิดพลาด) ลองอีกครั้ง");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-5">
      {jobs.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">ตำแหน่งที่ใช้จัดอันดับ</label>
          <select
            value={jobId}
            onChange={(e) => pickJob(e.target.value)}
            className="h-10 w-full max-w-md rounded-[var(--radius-card)] field px-2.5 text-sm text-ink"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Drop zone — label ครอบ input เพื่อให้ click ทำงานได้ทุก browser */}
      <label
        className="block rounded-[var(--radius-card)] border-2 border-dashed border-border-strong bg-surface p-6 text-center transition-colors hover:border-ink hover:bg-surface-2 cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) onFiles(e.dataTransfer.files); }}
      >
        <div className="text-2xl mb-2">📄</div>
        <p className="text-sm font-medium text-ink">วาง PDF หรือคลิกเพื่อเลือกไฟล์</p>
        <p className="mt-1 text-xs text-ink-3">รองรับหลายไฟล์พร้อมกัน — Claude จะอ่านและ extract ข้อมูลอัตโนมัติ</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && onFiles(e.target.files)}
        />
      </label>

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2 text-sm">
              <span className="text-ink truncate max-w-[80%]">📄 {f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(f.name)}
                className="text-xs text-ink-3 hover:text-[var(--danger)] ml-2"
              >
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--danger)] bg-danger-soft px-3 py-2 text-sm text-ink">{error}</div>
      )}
      {approveMsg && (
        <div className="rounded-[var(--radius-card)] border border-[var(--success)] bg-success-soft px-3 py-2 text-sm text-ink">{approveMsg}</div>
      )}

      <button
        type="button"
        disabled={busy || files.length === 0 || jdText.trim().length < 20}
        onClick={onRank}
        className="inline-flex items-center gap-2 h-10 rounded-[var(--radius-card)] btn-primary px-5 text-sm font-semibold disabled:opacity-40"
      >
        {busy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-ink)] border-t-transparent" aria-hidden />}
        {busy ? "AI กำลังอ่าน Resume…" : `จัดอันดับด้วย AI (${files.length} ไฟล์)`}
      </button>

      {result && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium text-ink">เลือกผู้สมัครที่ต้องการเพิ่มเข้า Tracker</p>
          {result.shortlist.map((c, i) => (
            <label
              key={i}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border-2 p-3 transition-all",
                selected.has(i)
                  ? "border-ink bg-[var(--primary)] shadow-[2px_2px_0px_0px_var(--ink)]"
                  : "border-border bg-surface hover:border-ink",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggleSelect(i)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink truncate">{c.name}</span>
                  <span className="shrink-0 rounded-md border border-ink bg-bg px-2 py-0.5 text-xs font-bold tabular-nums text-ink">
                    {c.fitScore}
                  </span>
                </div>
                {c.headline && <p className="mt-0.5 text-xs text-ink-2 truncate">{c.headline}</p>}
                {c.reasons?.length > 0 && (
                  <p className="mt-1 text-xs text-ink-3 line-clamp-2">{c.reasons.join(" · ")}</p>
                )}
              </div>
            </label>
          ))}

          <button
            type="button"
            disabled={approving || selected.size === 0}
            onClick={onApprove}
            className="inline-flex items-center justify-center gap-2 h-10 w-full rounded-[var(--radius-card)] btn-primary text-sm font-semibold disabled:opacity-40"
          >
            {approving && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-ink)] border-t-transparent" aria-hidden />}
            {approving ? "กำลังเพิ่ม…" : `อนุมัติ ${selected.size} คน → Tracker`}
          </button>
        </div>
      )}
    </div>
  );
}
