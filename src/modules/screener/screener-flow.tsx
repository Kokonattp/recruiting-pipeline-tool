"use client";

import { useRef, useState } from "react";
import type { JobDescription } from "@/lib/types";
import { runScreening } from "./actions";
import { ScoreCard } from "./score-card";
import type { Screening, Recommendation } from "./types";

/**
 * Resume Screener container. HR picks a saved JD (or pastes one), provides a CV as
 * pasted text or an uploaded PDF, runs the AI screening, and reviews the score card.
 * One client container owns form + result state.
 */
type CandidateOption = { applicationId: string; candidateId: string; name: string; jobId: string };

export function ScreenerFlow({
  jobs,
  candidates,
  initialApplicationId,
  initialJobId,
}: {
  jobs: JobDescription[];
  candidates: CandidateOption[];
  initialApplicationId?: string;
  initialJobId?: string;
}) {
  const startJob = jobs.find((j) => j.id === initialJobId) ?? jobs[0];
  const [jobId, setJobId] = useState(startJob?.id ?? "");
  const [jdText, setJdText] = useState(startJob?.rawText ?? "");
  // Which candidate this screening maps to (empty = not saved to anyone).
  const [applicationId, setApplicationId] = useState(initialApplicationId ?? "");

  function pickCandidate(appId: string) {
    setApplicationId(appId);
    const c = candidates.find((x) => x.applicationId === appId);
    if (c) pickJob(c.jobId); // align the JD to the candidate's job
  }
  const [cvText, setCvText] = useState("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [result, setResult] = useState<Screening | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickJob(id: string) {
    setJobId(id);
    const j = jobs.find((x) => x.id === id);
    if (j) setJdText(j.rawText);
  }

  async function onPdf(file: File) {
    const buf = await file.arrayBuffer();
    // base64 without the data: prefix — Claude's document block wants raw base64
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    setPdfBase64(b64);
    setPdfName(file.name);
    setCvText(""); // PDF takes precedence
  }

  async function onScreen() {
    setBusy(true);
    setError(null);
    const r = await runScreening({
      jdText,
      cvText: pdfBase64 ? undefined : cvText,
      cvPdfBase64: pdfBase64 ?? undefined,
      applicationId, // when set (from a Tracker card), the score saves to that candidate
    });
    setBusy(false);
    if (r.ok) {
      setResult(r.screening);
      setRecommendation(r.recommendation);
    }
    else setError(r.error);
  }

  const hasCv = !!pdfBase64 || cvText.trim().length >= 40;
  const canRun = jdText.trim().length >= 20 && hasCv && !busy;

  return (
    <div className="space-y-6">
      {candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-ink">ผู้สมัคร:</label>
          <select
            value={applicationId}
            onChange={(e) => pickCandidate(e.target.value)}
            className="h-9 min-w-56 rounded-[var(--radius-card)] field px-2.5 text-sm text-ink"
          >
            <option value="">— ไม่ผูกกับใคร (โหมดทดสอบ ไม่บันทึก) —</option>
            {candidates.map((c) => (
              <option key={c.applicationId} value={c.applicationId}>{c.name}</option>
            ))}
          </select>
          {applicationId && <span className="text-xs text-[var(--success)]">✓ คะแนนจะบันทึกเข้าผู้สมัครนี้</span>}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* JD side */}
        <div className="space-y-2">
          {jobs.length > 0 && (
            <select
              value={jobId}
              onChange={(e) => pickJob(e.target.value)}
              className="h-10 w-full rounded-[var(--radius-card)] field px-2.5 text-sm text-ink "
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          )}
          <label className="block text-sm font-medium text-ink">Job Description</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={9}
            placeholder="เลือกตำแหน่งด้านบน หรือวาง JD ที่นี่…"
            className="w-full rounded-[var(--radius-card)] field p-3 text-sm text-ink placeholder:text-ink-3 "
          />
        </div>

        {/* CV side */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink">CV ผู้สมัคร</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-medium text-primary hover:underline"
            >
              อัปโหลด PDF
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => e.target.files?.[0] && onPdf(e.target.files[0])}
            />
          </div>

          {pdfName ? (
            <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2.5 text-sm">
              <span className="truncate text-ink">📄 {pdfName}</span>
              <button
                type="button"
                onClick={() => { setPdfBase64(null); setPdfName(null); }}
                className="text-xs text-ink-3 hover:text-[var(--danger)]"
              >
                ลบ
              </button>
            </div>
          ) : (
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              rows={9}
              placeholder="วางข้อความ CV ที่นี่ หรือกด 'อัปโหลด PDF' ด้านบน…"
              className="w-full rounded-[var(--radius-card)] field p-3 text-sm text-ink placeholder:text-ink-3 "
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--danger)] bg-danger-soft px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canRun}
          onClick={onScreen}
          className="inline-flex items-center gap-2 h-10 rounded-[var(--radius-card)] btn-primary px-5 text-sm font-semibold"
        >
          {busy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-ink)] border-t-transparent" aria-hidden />}
          {busy ? "AI กำลังประเมิน…" : "ประเมินด้วย AI"}
        </button>
        {!canRun && !busy && (
          <span className="text-xs text-ink-3">
            {jdText.trim().length < 20
              ? "← เลือก/วาง Job Description ก่อน"
              : "← ใส่ CV ผู้สมัคร (วางข้อความ ≥40 ตัวอักษร หรืออัปโหลด PDF) ก่อนถึงจะประเมินได้"}
          </span>
        )}
      </div>

      {busy && (
        <div className="border-t border-border pt-6 space-y-4" aria-busy="true" aria-label="AI กำลังประเมิน">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="loga-card rounded-[var(--radius-card)] border bg-surface p-4 space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
                <div className="h-8 w-12 animate-pulse rounded bg-surface-2" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-surface-2" style={{ width: `${70 + i * 10}%` }} />
            ))}
          </div>
          <p className="text-xs text-ink-3">AI กำลังอ่าน CV และประเมิน 3 มิติ…</p>
        </div>
      )}

      {result && !busy && (
        <div className="border-t border-border pt-6">
          <ScoreCard screening={result} recommendation={recommendation ?? "CONSIDER"} jobTitle={jobs.find((j) => j.id === jobId)?.title} />
        </div>
      )}
    </div>
  );
}
