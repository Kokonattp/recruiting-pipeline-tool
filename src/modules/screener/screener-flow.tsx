"use client";

import { useState } from "react";
import { runScreening } from "./actions";
import { ScoreCard } from "./score-card";
import type { Screening } from "./types";

/**
 * Resume Screener container. HR pastes a JD + a CV, runs the AI screening, and reviews
 * the score card. One client container owns the form + result state. (PDF upload is
 * added at link time via Claude's document input.)
 */
export function ScreenerFlow() {
  const [jdText, setJdText] = useState("");
  const [cvText, setCvText] = useState("");
  const [result, setResult] = useState<Screening | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onScreen() {
    setBusy(true);
    setError(null);
    const r = await runScreening({ jdText, cvText });
    setBusy(false);
    if (r.ok) setResult(r.screening);
    else setError(r.error);
  }

  const canRun = jdText.trim().length >= 20 && cvText.trim().length >= 40 && !busy;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          label="Job Description"
          value={jdText}
          onChange={setJdText}
          placeholder="วางรายละเอียดตำแหน่งที่ใช้ประเมิน…"
        />
        <Field
          label="CV ผู้สมัคร"
          value={cvText}
          onChange={setCvText}
          placeholder="วางข้อความ CV (รองรับ upload PDF เมื่อเชื่อม Claude API)…"
        />
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
          <ScoreCard screening={result} />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-card)] border border-border bg-bg p-3 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none"
      />
    </div>
  );
}
