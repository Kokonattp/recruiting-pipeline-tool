"use client";

import { useRef, useState } from "react";
import type { JobDescription, Source } from "@/lib/types";
import { importCsvAndRank } from "./actions";
import type { RankResult, RawCandidate } from "./types";

/**
 * CSV intake — an alternative to scraping that always works (no anti-bot risk).
 * HR uploads a CSV exported from a job board / LinkedIn; we parse rows into
 * RawCandidate and run the same AI ranking. Expected columns (case-insensitive):
 * name, headline, email, url, source, snippet — all optional except a name.
 */
export function CsvImport({ jobs }: { jobs: JobDescription[] }) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [jdText, setJdText] = useState(jobs[0]?.rawText ?? "");
  const [rows, setRows] = useState<RawCandidate[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<RankResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickJob(id: string) {
    setJobId(id);
    const j = jobs.find((x) => x.id === id);
    if (j) setJdText(j.rawText);
  }

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    setFileName(`${file.name} (${parsed.length} แถว)`);
    setError(parsed.length === 0 ? "อ่าน CSV ไม่พบข้อมูล หรือไม่มีคอลัมน์ name" : null);
  }

  async function onRank() {
    setBusy(true);
    setError(null);
    const r = await importCsvAndRank({ jdText, rows });
    setBusy(false);
    if (r.ok) setResult(r.data);
    else setError(r.error);
  }

  return (
    <div className="space-y-4">
      {jobs.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">ตำแหน่งที่ใช้จัดอันดับ</label>
          <select
            value={jobId}
            onChange={(e) => pickJob(e.target.value)}
            className="h-10 w-full max-w-md rounded-[var(--radius-card)] field px-2.5 text-sm text-ink "
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface p-5 text-center">
        <p className="text-sm text-ink-2">อัปโหลดไฟล์ CSV ของผู้สมัคร (คอลัมน์: name, headline, email, url, source, snippet)</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-3 h-9 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink hover:bg-surface-2"
        >
          เลือกไฟล์ CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {fileName && <p className="mt-2 text-xs text-ink-3">📄 {fileName}</p>}
      </div>

      {error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--danger)] bg-danger-soft px-3 py-2 text-sm text-ink">{error}</div>
      )}

      <button
        type="button"
        disabled={busy || rows.length === 0 || jdText.trim().length < 20}
        onClick={onRank}
        className="h-10 rounded-[var(--radius-card)] bg-primary px-5 text-sm font-medium text-primary-ink hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "AI กำลังจัดอันดับ…" : "จัดอันดับด้วย AI"}
      </button>

      {result && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm text-ink-2">จัดอันดับ {result.shortlist.length} ผู้สมัคร</p>
          {result.shortlist.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2">
              <div>
                <div className="text-sm font-medium text-ink">{c.name}</div>
                <div className="text-xs text-ink-3">{c.headline}</div>
              </div>
              <span className="rounded-md bg-primary-soft px-2 py-1 text-sm font-semibold tabular-nums text-ink">{c.fitScore}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Minimal CSV parser: header row maps known columns; quotes handled simply. */
function parseCsv(text: string): RawCandidate[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const out: RawCandidate[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    const name = cols[idx("name")]?.trim();
    if (!name) continue;
    const rawSource = cols[idx("source")]?.trim().toUpperCase();
    const validSources = ["LINKEDIN", "JOBSDB", "JOBBKK", "JOBTHAI", "FACEBOOK", "WEB", "REFERRAL", "MANUAL"];
    out.push({
      source: (validSources.includes(rawSource) ? rawSource : "MANUAL") as Source,
      name,
      headline: cols[idx("headline")]?.trim() || undefined,
      sourceUrl: cols[idx("url")]?.trim() || undefined,
      snippet: cols[idx("snippet")]?.trim() || undefined,
    });
  }
  return out;
}

function splitRow(line: string): string[] {
  // simple split that respects double-quoted fields
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else cur += ch;
  }
  result.push(cur);
  return result;
}
