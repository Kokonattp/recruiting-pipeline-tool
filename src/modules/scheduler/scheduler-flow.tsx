"use client";

import { useMemo, useState } from "react";
import type { ApplicationWithRelations, Interview } from "@/lib/types";
import { findConflicts, type Conflict } from "./conflict";
import { createInterview, cancelInterview, rescheduleInterview, getGoogleAuthUrl } from "./actions";

/**
 * Interview Scheduler. HR connects Google once, picks a candidate + time + duration;
 * conflict detection runs live (pure findConflicts) and warns before booking. Booking
 * creates a real Calendar event + Meet link and advances the candidate's stage.
 */
export function SchedulerFlow({
  interviews,
  candidates,
  googleConnected,
}: {
  interviews: Interview[];
  candidates: ApplicationWithRelations[];
  googleConnected: boolean;
}) {
  const [applicationId, setApplicationId] = useState(candidates[0]?.id ?? "");
  const [datetime, setDatetime] = useState("");
  const [duration, setDuration] = useState(30);
  // Off by default: the calendar event is still created, but no email invite goes to the
  // candidate — so testing/demo never disturbs a real person sourced from the web.
  const [notifyCandidate, setNotifyCandidate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const conflicts: Conflict[] = useMemo(() => {
    if (!datetime) return [];
    const startsAt = new Date(datetime);
    if (Number.isNaN(startsAt.getTime())) return [];
    return findConflicts({ startsAt, durationMin: duration }, interviews);
  }, [datetime, duration, interviews]);

  // applicationId → "ชื่อ — ตำแหน่ง", so the agenda/calendar can show WHO each slot is with.
  const nameByApp = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of candidates) m.set(c.id, `${c.candidate.name} — ${c.job.title}`);
    return m;
  }, [candidates]);

  async function connect() {
    const r = await getGoogleAuthUrl();
    if (r.ok && r.data) window.location.href = r.data;
    else setMsg({ kind: "err", text: r.ok ? "ไม่ได้ URL" : r.error });
  }

  async function book() {
    const cand = candidates.find((c) => c.id === applicationId);
    if (!cand) return;
    setBusy(true);
    setMsg(null);
    const r = await createInterview({
      applicationId,
      startsAt: new Date(datetime).toISOString(),
      durationMin: duration,
      summary: `สัมภาษณ์: ${cand.candidate.name} — ${cand.job.title}`,
      description: cand.screening
        ? `คำถามแนะนำ:\n${cand.screening.prescreenQuestions.map((q) => `• ${q}`).join("\n")}`
        : "",
      attendeeEmails: notifyCandidate && cand.candidate.email ? [cand.candidate.email] : [],
    });
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: "ok", text: "สร้างนัด + Google Meet สำเร็จ — sync เข้า Tracker แล้ว" });
      setDatetime("");
    } else setMsg({ kind: "err", text: r.error });
  }

  if (!googleConnected) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-14 text-center"
        style={{ backgroundImage: "var(--hero-wash)" }}
      >
        <span
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-ink shadow-[var(--shadow-primary)]"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />
          </svg>
        </span>
        <h2 className="mt-4 text-xl font-bold text-ink">เชื่อมต่อ Google Calendar</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">
          อนุญาตให้ระบบสร้างนัดสัมภาษณ์ในปฏิทินของคุณ พร้อม Meet link และส่ง invite ให้ผู้สมัครอัตโนมัติ
        </p>
        <button
          type="button"
          onClick={connect}
          className="mx-auto mt-6 inline-flex h-11 items-center gap-2.5 rounded-[var(--radius-card)] bg-primary px-6 text-sm font-semibold text-primary-ink shadow-[var(--shadow-primary)] transition-transform hover:-translate-y-0.5"
        >
          <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-ink text-[11px] font-bold text-primary">G</span>
          เชื่อมต่อ Google Calendar
        </button>
        {msg && <p className="mt-3 text-sm text-[var(--danger)]">{msg.text}</p>}
      </div>
    );
  }

  const canBook = applicationId !== "" && datetime !== "" && conflicts.length === 0 && !busy;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-4">
        <Select
          label="ผู้สมัคร"
          value={applicationId}
          onChange={setApplicationId}
          options={candidates.map((c) => ({ value: c.id, label: `${c.candidate.name} — ${c.job.title}` }))}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">วันและเวลา</label>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-card)] field px-3 text-sm text-ink "
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">ระยะเวลา</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="h-10 w-full rounded-[var(--radius-card)] field px-3 text-sm text-ink "
          >
            {[15, 30, 45, 60].map((m) => (
              <option key={m} value={m}>{m} นาที</option>
            ))}
          </select>
        </div>

        {conflicts.length > 0 && (
          <div className="rounded-[var(--radius-card)] border border-[var(--warning)] bg-warning-soft px-3 py-2.5 text-sm text-ink">
            ⚠️ เวลานี้ชนกับนัดที่มีอยู่ {conflicts.length} รายการ
          </div>
        )}

        {msg && (
          <div
            className={`rounded-[var(--radius-card)] border px-3 py-2.5 text-sm text-ink ${
              msg.kind === "ok"
                ? "border-[var(--success)] bg-success-soft"
                : "border-[var(--danger)] bg-danger-soft"
            }`}
          >
            {msg.text}
          </div>
        )}

        <label className="flex items-start gap-2 rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={notifyCandidate}
            onChange={(e) => setNotifyCandidate(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          />
          <span className="text-ink-2">
            ส่งอีเมล invite ให้ผู้สมัคร
            <span className="block text-xs text-ink-3">ปิดไว้ตอนทดสอบ — นัดจะถูกสร้างในปฏิทินคุณ แต่ไม่ส่งเมลรบกวนผู้สมัคร</span>
          </span>
        </label>

        <button
          type="button"
          disabled={!canBook}
          onClick={book}
          className="h-10 w-full rounded-[var(--radius-card)] bg-primary text-sm font-medium text-primary-ink hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "กำลังสร้างนัด…" : "สร้างนัด + Google Meet"}
        </button>
      </div>

      <UpcomingPanel interviews={interviews} nameByApp={nameByApp} />
    </div>
  );
}

type NameByApp = Map<string, string>;

/** Right column: upcoming interviews, switchable between a list and a day-grouped
 *  calendar/agenda. Both show who/when/how long; the calendar groups by date. */
function UpcomingPanel({ interviews, nameByApp }: { interviews: Interview[]; nameByApp: NameByApp }) {
  const [view, setView] = useState<"list" | "calendar">("calendar");

  const upcoming = interviews
    .filter((i) => i.status !== "CANCELLED")
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">นัดสัมภาษณ์ ({upcoming.length})</h3>
        <div className="inline-flex rounded-[var(--radius-card)] border-2 border-border-strong p-0.5">
          {(["calendar", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={[
                "rounded-[calc(var(--radius-card)-3px)] px-3 py-1 text-xs font-semibold transition-colors",
                view === v ? "bg-primary text-primary-ink" : "text-ink-2 hover:text-ink",
              ].join(" ")}
            >
              {v === "calendar" ? "ปฏิทิน" : "รายการ"}
            </button>
          ))}
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface-2/60 px-4 py-10 text-center text-sm text-ink-3">
          ยังไม่มีนัดสัมภาษณ์ — สร้างนัดแรกจากฟอร์มด้านซ้าย
        </div>
      ) : view === "calendar" ? (
        <CalendarView interviews={upcoming} nameByApp={nameByApp} />
      ) : (
        <ul className="space-y-2">
          {upcoming.map((iv) => (
            <InterviewRow key={iv.id} iv={iv} name={nameByApp.get(iv.applicationId)} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Day-grouped agenda: a header per date, then the interviews that day with who + time
 *  range + duration. Reads like a calendar's day column without a full month grid
 *  (HR cares "who's next", and the real month view lives in Google Calendar). */
function CalendarView({ interviews, nameByApp }: { interviews: Interview[]; nameByApp: NameByApp }) {
  const byDay = useMemo(() => {
    const groups = new Map<string, Interview[]>();
    for (const iv of interviews) {
      const key = new Date(iv.scheduledAt).toLocaleDateString("th-TH", { dateStyle: "full" });
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(iv);
    }
    return [...groups.entries()];
  }, [interviews]);

  return (
    <div className="space-y-4">
      {byDay.map(([day, items]) => (
        <div key={day} className="loga-card rounded-[var(--radius-card)] border bg-surface p-3">
          <div className="mb-2 flex items-center gap-2">
            <span aria-hidden className="h-4 w-1.5 rounded-full bg-primary" />
            <h4 className="text-sm font-bold text-ink">{day}</h4>
            <span className="ml-auto text-xs font-semibold text-ink-3">{items.length} นัด</span>
          </div>
          <ul className="space-y-1.5">
            {items.map((iv) => {
              const start = new Date(iv.scheduledAt);
              const end = new Date(start.getTime() + iv.durationMin * 60_000);
              const range = `${start.toLocaleTimeString("th-TH", { timeStyle: "short" })}–${end.toLocaleTimeString("th-TH", { timeStyle: "short" })}`;
              return (
                <li key={iv.id} className="flex items-center gap-3 rounded-md bg-bg px-2.5 py-2">
                  <span className="shrink-0 text-xs font-bold tabular-nums text-primary-ink rounded bg-primary px-1.5 py-0.5">
                    {start.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {nameByApp.get(iv.applicationId) ?? "ผู้สมัคร"}
                    </div>
                    <div className="text-xs text-ink-3">{range} · {iv.durationMin} นาที</div>
                  </div>
                  {iv.meetLink && (
                    <a href={iv.meetLink} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-primary hover:underline">
                      Meet
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function InterviewRow({ iv, name }: { iv: Interview; name?: string }) {
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newAt, setNewAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    await cancelInterview(iv.id, iv.googleEventId);
    setBusy(false);
  }

  async function saveReschedule() {
    setBusy(true);
    setError(null);
    const r = await rescheduleInterview(
      { interviewId: iv.id, startsAt: new Date(newAt).toISOString(), durationMin: iv.durationMin },
      iv.googleEventId,
    );
    setBusy(false);
    if (r.ok) {
      setRescheduling(false);
      setNewAt("");
    } else setError(r.error);
  }

  return (
    <li className="loga-card rounded-[var(--radius-card)] border bg-surface p-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          {name && <div className="truncate text-sm font-semibold text-ink">{name}</div>}
          <div className="text-sm text-ink-2">
            {new Date(iv.scheduledAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
          </div>
          <div className="text-xs text-ink-3">{iv.durationMin} นาที · {iv.status}</div>
        </div>
        <div className="flex items-center gap-3">
          {iv.meetLink && (
            <a href={iv.meetLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
              เข้า Meet
            </a>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setRescheduling((v) => !v)}
            className="text-xs text-ink-3 hover:text-ink-2 disabled:opacity-40"
          >
            เลื่อน
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={cancel}
            className="text-xs text-ink-3 hover:text-[var(--danger)] disabled:opacity-40"
          >
            {busy ? "…" : "ยกเลิก"}
          </button>
        </div>
      </div>

      {rescheduling && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <input
            type="datetime-local"
            value={newAt}
            onChange={(e) => setNewAt(e.target.value)}
            className="h-9 flex-1 rounded-[var(--radius-card)] field px-2.5 text-sm text-ink "
          />
          <button
            type="button"
            disabled={busy || !newAt}
            onClick={saveReschedule}
            className="h-9 rounded-[var(--radius-card)] bg-primary px-3 text-sm font-medium text-primary-ink hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "กำลังเลื่อน…" : "ยืนยันเวลาใหม่"}
          </button>
          {error && <span className="w-full text-xs text-[var(--danger)]">{error}</span>}
        </div>
      )}
    </li>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-[var(--radius-card)] field px-2.5 text-sm text-ink "
      >
        {options.length === 0 && <option value="">— ยังไม่มีผู้สมัครในระบบ —</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
