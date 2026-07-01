"use client";

import { useState, useEffect } from "react";
import { SOURCE_LABELS, SOURCES, type JobDescription, type Source } from "@/lib/types";
import {
  approveCandidates,
  generateQueryPlan,
  type ActionResult,
} from "./actions";

type SourceTally = { name: string; found: number; ok: boolean }[];
import type { QueryPlan, RankResult, RawCandidate } from "./types";

/** Default sources to search — the ones that always work without extra setup. */
const DEFAULT_SOURCES: Source[] = ["WEB", "GITHUB"];

type Step = "jd" | "plan" | "shortlist";

/**
 * Module 1 sourcing wizard. One client container owns the whole flow state
 * (JD → query plan → shortlist → approve), so there's a single source of truth and no
 * prop-drilling. Each async step calls a Server Action and surfaces errors inline.
 * `jobs` lets HR pick a saved JD (so approved candidates attach to a real job).
 */
export function SourcingFlow({ jobs }: { jobs: JobDescription[] }) {
  const [step, setStep] = useState<Step>("jd");
  const [jobId, setJobId] = useState<string>(jobs[0]?.id ?? "");
  const [jdText, setJdText] = useState(jobs[0]?.rawText ?? "");
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [plan, setPlan] = useState<QueryPlan | null>(null);
  const [result, setResult] = useState<RankResult | null>(null);
  const [rawCandidates, setRawCandidates] = useState<RawCandidate[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const [tally, setTally] = useState<SourceTally>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Warn before navigating away while a search is in progress
  useEffect(() => {
    if (!busy) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [busy]);

  function toggleSource(s: Source) {
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function unwrap<T>(r: ActionResult<T>): T | null {
    if (r.ok) {
      setError(null);
      return r.data;
    }
    setError(r.error);
    return null;
  }

  async function onGeneratePlan() {
    setBusy(true);
    try {
      const r = await generateQueryPlan({ jdText, sources });
      const data = unwrap(r);
      if (data) {
        setPlan(data);
        setStep("plan");
      }
    } catch {
      // Server Action threw before resolving (e.g. function timeout) — without this,
      // busy never resets and the button spins forever with no feedback.
      setError("สร้างคำค้นหาไม่สำเร็จ (เซิร์ฟเวอร์ใช้เวลานานเกินไปหรือผิดพลาด) ลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  async function onRunScrape() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    setRawCandidates([]);
    setIsRanking(false);
    setTally([]);

    try {
      const res = await fetch("/api/sourcing-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jdText, plan }),
      });

      if (!res.ok || !res.body) {
        setError("เชื่อมต่อ sourcing stream ไม่ได้");
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim()) as {
              type: string;
              source?: string;
              candidates?: RawCandidate[];
              shortlist?: RankResult["shortlist"];
              message?: string;
            };
            if (ev.type === "raw" && ev.candidates) {
              setRawCandidates((prev) => [...prev, ...ev.candidates!]);
              setTally((prev) => {
                const existing = prev.find((t) => t.name === ev.source);
                if (existing) return prev.map((t) => t.name === ev.source ? { ...t, found: t.found + ev.candidates!.length } : t);
                return [...prev, { name: ev.source ?? "Unknown", found: ev.candidates!.length, ok: true }];
              });
            } else if (ev.type === "sourceError") {
              const detail = (ev as { detail?: string }).detail;
              setTally((prev) => [...prev, { name: (ev.source ?? "Unknown") + (detail ? ` (${detail})` : ""), found: 0, ok: false }]);
            } else if (ev.type === "ranking") {
              setIsRanking(true);
            } else if (ev.type === "ranked" && ev.shortlist) {
              setResult({ shortlist: ev.shortlist });
              setStep("shortlist");
            } else if (ev.type === "error") {
              setError(ev.message ?? "ผิดพลาด");
            }
          } catch { /* malformed chunk */ }
        }
      }
    } catch {
      // fetch/stream threw (network drop, server crash mid-stream) — without this,
      // busy never resets and the search spinner hangs forever with no feedback.
      setError("การเชื่อมต่อขาดหายระหว่างค้นหา ลองอีกครั้ง");
    } finally {
      setBusy(false);
      setIsRanking(false);
    }
  }

  async function onApprove(selected: RankResult["shortlist"]): Promise<string | null> {
    if (!jobId) return "เลือกตำแหน่ง (JD) ที่บันทึกไว้ก่อนอนุมัติ";
    const r = await approveCandidates({ jobId, selected });
    if (r.ok) return null;
    return r.error;
  }

  function onPickJob(id: string) {
    setJobId(id);
    const job = jobs.find((j) => j.id === id);
    if (job) setJdText(job.rawText);
  }

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />
      {error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--danger)] bg-danger-soft px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      {step === "jd" && (
        <JdStep
          jobs={jobs}
          jobId={jobId}
          onPickJob={onPickJob}
          jdText={jdText}
          onJd={setJdText}
          sources={sources}
          onToggle={toggleSource}
          busy={busy}
          onNext={onGeneratePlan}
        />
      )}

      {step === "plan" && plan && (
        <PlanStep
          plan={plan}
          busy={busy}
          isRanking={isRanking}
          rawCandidates={rawCandidates}
          onBack={() => setStep("jd")}
          onRun={onRunScrape}
        />
      )}

      {step === "shortlist" && result && (
        <ShortlistStep result={result} tally={tally} onBack={() => setStep("plan")} onApprove={onApprove} />
      )}
    </div>
  );
}

// ── steps ───────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "jd", label: "1 · Job Description" },
    { id: "plan", label: "2 · คำค้นหา (AI)" },
    { id: "shortlist", label: "3 · ผลลัพธ์ & อนุมัติ" },
  ];
  const order: Step[] = ["jd", "plan", "shortlist"];
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {steps.map((s) => {
        const done = order.indexOf(current) > order.indexOf(s.id);
        const active = current === s.id;
        return (
          <li
            key={s.id}
            className={
              active ? "font-semibold text-ink" : done ? "text-ink-2" : "text-ink-3"
            }
          >
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}

// Sources that require Firecrawl (FIRECRAWL_API_KEY) — public job-board pages.
const FIRECRAWL_SOURCES: Source[] = ["JOBSDB", "JOBTHAI"];

function JdStep({
  jobs,
  jobId,
  onPickJob,
  jdText,
  onJd,
  sources,
  onToggle,
  busy,
  onNext,
}: {
  jobs: JobDescription[];
  jobId: string;
  onPickJob: (id: string) => void;
  jdText: string;
  onJd: (v: string) => void;
  sources: Source[];
  onToggle: (s: Source) => void;
  busy: boolean;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      {jobs.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">เลือกตำแหน่งที่บันทึกไว้</label>
          <select
            value={jobId}
            onChange={(e) => onPickJob(e.target.value)}
            className="h-10 w-full max-w-md rounded-[var(--radius-card)] field px-2.5 text-sm text-ink "
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-3">หรือสร้างตำแหน่งใหม่ด้วย JD Generator ด้านบน แล้วแก้ข้อความด้านล่างได้</p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Job Description</label>
        <textarea
          value={jdText}
          onChange={(e) => onJd(e.target.value)}
          rows={8}
          placeholder="วางรายละเอียดตำแหน่งที่ต้องการหา เช่น Senior AI Workflow & Automation Engineer — ทักษะ, ประสบการณ์, สิ่งที่ต้องมี…"
          className="w-full resize-y rounded-[var(--radius-card)] field p-3 text-sm text-ink placeholder:text-ink-3"
          style={{ maxHeight: "280px" }}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">ค้นหาจากแหล่ง</legend>
        <div className="flex flex-wrap gap-2">
          {SOURCES.filter((s) => s !== "REFERRAL" && s !== "MANUAL" && s !== "JOBBKK" && s !== "LINKEDIN" && s !== "FACEBOOK").map((s) => {
            const needsFirecrawl = FIRECRAWL_SOURCES.includes(s);
            const on = sources.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggle(s)}
                title={needsFirecrawl ? `ต้องตั้งค่า FIRECRAWL_API_KEY ก่อน — เลือกได้แต่จะไม่พบผลลัพธ์ถ้ายังไม่ตั้งค่า` : undefined}
                className={[
                  "rounded-[var(--radius-card)] border-2 px-3 py-1.5 text-sm font-bold transition-all",
                  on
                    ? "border-ink bg-[var(--primary)] text-[var(--primary-ink)] shadow-[2px_2px_0px_0px_var(--ink)] active:translate-x-px active:translate-y-px active:shadow-none"
                    : "border-border-strong bg-bg text-ink-2 hover:border-ink hover:bg-surface-2 shadow-[2px_2px_0px_0px_transparent] hover:shadow-[2px_2px_0px_0px_var(--ink)]",
                ].join(" ")}
              >
                {SOURCE_LABELS[s]}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-ink-3">
          JobsDB/JobThai ต้องตั้งค่า FIRECRAWL_API_KEY ก่อนถึงจะใช้งานได้จริง
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || jdText.trim().length < 20 || sources.length === 0}
          onClick={onNext}
          className="h-10 rounded-[var(--radius-card)] btn-primary px-5 text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
        >
          {busy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-ink)] border-t-transparent" aria-hidden />}
          {busy ? "AI กำลังสร้างคำค้นหา…" : "สร้างคำค้นหาด้วย AI →"}
        </button>
        {!busy && (jdText.trim().length < 20 || sources.length === 0) && (
          <span className="text-xs text-ink-3">
            {jdText.trim().length < 20 ? "← วาง Job Description ก่อน" : "← เลือกแหล่งค้นหาอย่างน้อย 1 แหล่ง"}
          </span>
        )}
      </div>
    </div>
  );
}

function PlanStep({
  plan,
  busy,
  isRanking,
  rawCandidates,
  onBack,
  onRun,
}: {
  plan: QueryPlan;
  busy: boolean;
  isRanking: boolean;
  rawCandidates: RawCandidate[];
  onBack: () => void;
  onRun: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="loga-card rounded-[var(--radius-card)] border bg-surface p-4">
        <p className="text-sm text-ink-2">{plan.roleSummary}</p>
        {plan.mustHaveSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {plan.mustHaveSkills.map((s) => (
              <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-ink-2">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {plan.queries.map((q, i) => (
          <div key={i} className="rounded-[var(--radius-card)] border border-border bg-bg p-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
                {SOURCE_LABELS[q.source]}
              </span>
              <code className="text-sm text-ink">{q.query}</code>
            </div>
            <p className="mt-1 text-xs text-ink-3">{q.rationale}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="h-10 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 hover:bg-surface-2 disabled:opacity-40"
        >
          ← แก้ JD
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRun}
          className="h-10 rounded-[var(--radius-card)] btn-primary px-5 text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
        >
          {busy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-ink)] border-t-transparent" aria-hidden />}
          {busy ? (isRanking ? "AI กำลังจัดอันดับ…" : "กำลังค้นหา…") : "เริ่มค้นหาผู้สมัคร →"}
        </button>
      </div>

      {/* Live feed: raw candidates stream in as sources respond */}
      {busy && rawCandidates.length === 0 && !isRanking && (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-ink-2">กำลังค้นหาทุกแหล่งพร้อมกัน…</span>
        </div>
      )}

      {rawCandidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-2">
            พบแล้ว {rawCandidates.length} ราย
            {isRanking && <span className="ml-2 text-ink-3">— AI กำลังจัดอันดับ…</span>}
          </p>
          {rawCandidates.map((c, i) => (
            <div key={i} className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-bg px-3 py-2">
              <span className="mt-0.5 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-ink-3 shrink-0">
                {c.source}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{c.name ?? "ไม่ระบุชื่อ"}</p>
                {c.headline && <p className="text-xs text-ink-3 truncate">{c.headline}</p>}
                {c.sourceUrl && (
                  <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-ink-3 hover:text-primary hover:underline truncate block">
                    {c.sourceUrl}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!busy && rawCandidates.length === 0 && (
        <p className="text-xs text-ink-3">
          คลิกเดียว ระบบจะค้นหาทุกแหล่งพร้อมกัน แล้วแสดงผู้สมัครทันทีที่แต่ละแหล่งตอบ — AI จัดอันดับให้เมื่อครบ
        </p>
      )}
    </div>
  );
}

function ShortlistStep({
  result,
  tally,
  onBack,
  onApprove,
}: {
  result: RankResult;
  tally: SourceTally;
  onBack: () => void;
  onApprove: (selected: RankResult["shortlist"]) => Promise<string | null>;
}) {
  if (result.shortlist.length === 0) {
    return (
      <div className="space-y-4">
        <SourceTallyBar tally={tally} />
        <p className="text-sm text-ink-2">ไม่พบผู้สมัครที่เข้าเกณฑ์จากรอบนี้ ลองปรับ JD หรือเพิ่มแหล่งค้นหา</p>
        <button
          type="button"
          onClick={onBack}
          className="h-10 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 hover:bg-surface-2"
        >
          ← กลับ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SourceTallyBar tally={tally} />
      <ShortlistBody result={result} onBack={onBack} onApprove={onApprove} />
    </div>
  );
}

/** Shows where the merged shortlist came from — each source + how many it returned. */
function SourceTallyBar({ tally }: { tally: SourceTally }) {
  if (tally.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-ink-3">ค้นจาก:</span>
      {tally.map((s) => (
        <span
          key={s.name}
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            s.ok ? "border-border bg-surface text-ink-2" : "border-border bg-surface-2 text-ink-3",
          ].join(" ")}
          title={s.ok ? `พบ ${s.found} รายการ` : "แหล่งนี้ไม่พร้อมใช้งาน"}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: s.ok ? "var(--success)" : "var(--border-strong)" }}
          />
          {s.name}
          <span className="font-bold tabular-nums">{s.found}</span>
        </span>
      ))}
    </div>
  );
}

function ShortlistBody({
  result,
  onBack,
  onApprove,
}: {
  result: RankResult;
  onBack: () => void;
  onApprove: (selected: RankResult["shortlist"]) => Promise<string | null>;
}) {
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<Source | "ALL">("ALL");
  // Index into result.shortlist — candidates have no stable id, but the array
  // itself never reorders, so index is a safe selection key here.
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(result.shortlist.map((_, i) => i)), // all selected by default
  );

  // Sources actually present in this shortlist — only show filter pills that do something.
  const sourcesPresent = Array.from(new Set(result.shortlist.map((c) => c.source)));

  // Filter first (keeping each candidate's original index for selection), then paginate.
  const filtered = result.shortlist
    .map((c, index) => ({ c, index }))
    .filter(({ c }) => sourceFilter === "ALL" || c.source === sourceFilter);

  const PAGE_SIZE = 10;
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function doApprove() {
    const picked = result.shortlist.filter((_, i) => selected.has(i));
    if (picked.length === 0) {
      setErr("เลือกผู้สมัครอย่างน้อย 1 คนก่อนอนุมัติ");
      return;
    }
    setApproving(true);
    setErr(null);
    try {
      const error = await onApprove(picked);
      if (error) setErr(error);
      else setApproved(true);
    } catch {
      setErr("อนุมัติไม่สำเร็จ (เซิร์ฟเวอร์ผิดพลาด) ลองอีกครั้ง");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">
          AI จัดอันดับ {result.shortlist.length} ผู้สมัคร — ตรวจแล้วเลือกอนุมัติเข้า Tracker
          {pageCount > 1 && ` (แสดง ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, result.shortlist.length)})`}
        </p>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={() => setSelected(new Set(result.shortlist.map((_, i) => i)))} className="font-medium text-primary hover:underline">
            เลือกทั้งหมด
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="font-medium text-ink-3 hover:underline">
            ไม่เลือกเลย
          </button>
        </div>
      </div>

      {sourcesPresent.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-ink-3">กรองตามแหล่ง:</span>
          <button
            type="button"
            onClick={() => { setSourceFilter("ALL"); setPage(0); }}
            className={[
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              sourceFilter === "ALL" ? "border-ink bg-primary text-primary-ink" : "border-border text-ink-2 hover:bg-surface-2",
            ].join(" ")}
          >
            ทั้งหมด ({result.shortlist.length})
          </button>
          {sourcesPresent.map((s) => {
            const count = result.shortlist.filter((c) => c.source === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setSourceFilter(s); setPage(0); }}
                className={[
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                  sourceFilter === s ? "border-ink bg-primary text-primary-ink" : "border-border text-ink-2 hover:bg-surface-2",
                ].join(" ")}
              >
                {SOURCE_LABELS[s]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-ink-3">ไม่มีผู้สมัครจากแหล่งนี้ ลองเลือก &quot;ทั้งหมด&quot; หรือแหล่งอื่น</p>
      )}

      <div className="space-y-3">
        {pageItems.map(({ c, index }) => {
          const checked = selected.has(index);
          return (
            <article
              key={index}
              className={[
                "loga-card rounded-[var(--radius-card)] border bg-surface p-4 transition-opacity",
                checked ? "" : "opacity-50",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(index)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                    <p className="text-xs text-ink-2">{c.headline}</p>
                  </div>
                </label>
                <span className="shrink-0 rounded-md bg-primary-soft px-2 py-1 text-sm font-semibold tabular-nums text-ink">
                  {c.fitScore}
                  <span className="text-xs font-normal text-ink-3">/100</span>
                </span>
              </div>
              {c.reasons.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-xs text-ink-2">
                  {c.reasons.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              )}
              {c.concerns.length > 0 && (
                <p className="mt-1.5 text-xs text-[var(--warning)]">ต้องเช็ค: {c.concerns.join(" · ")}</p>
              )}
            </article>
          );
        })}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="h-8 rounded-[var(--radius-card)] border border-border px-3 text-xs font-medium text-ink-2 hover:bg-surface-2 disabled:opacity-40"
          >
            ← ก่อนหน้า
          </button>
          <span className="text-xs text-ink-3">หน้า {page + 1} / {pageCount}</span>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 rounded-[var(--radius-card)] border border-border px-3 text-xs font-medium text-ink-2 hover:bg-surface-2 disabled:opacity-40"
          >
            ถัดไป →
          </button>
        </div>
      )}
      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      {approved ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--success)] bg-success-soft px-4 py-3 text-sm text-ink">
          ✓ อนุมัติเข้า Tracker แล้ว — ไปดูที่หน้า Applicant Tracker ได้เลย
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-10 rounded-[var(--radius-card)] border border-border px-4 text-sm font-medium text-ink-2 hover:bg-surface-2"
          >
            ← กลับ
          </button>
          <button
            type="button"
            disabled={approving || selected.size === 0}
            onClick={doApprove}
            className="h-10 rounded-[var(--radius-card)] btn-primary px-5 text-sm font-semibold disabled:opacity-60"
          >
            {approving ? "กำลังอนุมัติ…" : `อนุมัติ ${selected.size} คนเข้า Tracker`}
          </button>
        </div>
      )}
    </div>
  );
}
