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
export function ScreenerFlow({
  jobs,
  initialJobId,
  candidateName,
  applicationId,
}: {
  jobs: JobDescription[];
  initialJobId?: string;
  candidateName?: string;
  applicationId?: string;
}) {
  const startJob = jobs.find((j) => j.id === initialJobId) ?? jobs[0];
  const [jobId, setJobId] = useState(startJob?.id ?? "");
  const [jdText, setJdText] = useState(startJob?.rawText ?? "");
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
      {candidateName && (
        <div className="loga-card flex items-center gap-2 rounded-[var(--radius-card)] border bg-primary-soft px-4 py-2.5 text-sm">
          <span className="font-semibold text-ink">คัดกรองให้: {candidateName}</span>
          <span className="text-ink-2">— เลือก JD ให้แล้ว แค่แนบ CV แล้วกดประเมิน (คะแนนจะบันทึกเข้าผู้สมัครนี้)</span>
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

      <button
        type="button"
        disabled={!canRun}
        onClick={onScreen}
        className="h-10 rounded-[var(--radius-card)] bg-primary px-5 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "AI กำลังประเมิน…" : "ประเมินด้วย AI"}
      </button>

      {result && (
        <div className="border-t border-border pt-6">
          <ScoreCard screening={result} recommendation={recommendation ?? "CONSIDER"} jobTitle={jobs.find((j) => j.id === jobId)?.title} />
        </div>
      )}
    </div>
  );
}
