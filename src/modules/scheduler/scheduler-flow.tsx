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
    try {
      const r = await getGoogleAuthUrl();
      if (r.ok && r.data) window.location.href = r.data;
      else setMsg({ kind: "err", text: r.ok ? "ไม่ได้ URL" : r.error });
    } catch {
      setMsg({ kind: "err", text: "เชื่อมต่อ Google ไม่สำเร็จ ลองใหม่อีกครั้ง" });
    }
  }

  async function book() {
    const cand = candidates.find((c) => c.id === applicationId);
    if (!cand) return;
    setBusy(true);
    setMsg(null);
    try {
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
      if (r.ok) {
        setMsg({ kind: "ok", text: "สร้างนัด + Google Meet สำเร็จ — sync เข้า Tracker แล้ว" });
        setDatetime("");
      } else setMsg({ kind: "err", text: r.error });
    } catch {
      setMsg({ kind: "err", text: "สร้างนัดไม่สำเร็จ ลองใหม่อีกครั้ง" });
    } finally {
      setBusy(false);
    }
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
          className="mx-auto mt-6 inline-flex h-11 items-center gap-2.5 rounded-[var(--radius-card)] btn-primary px-6 text-sm font-semibold"
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
            <span className="block text-xs text-ink-3">
              {notifyCandidate
                ? "✉️ ผู้สมัครจะได้รับอีเมล invite + Meet link จริง"
                : "🔒 จะไม่ส่งเมล — สร้างนัดในปฏิทินคุณเท่านั้น (เหมาะตอนทดสอบ)"}
            </span>
          </span>
        </label>

        <button
          type="button"
          disabled={!canBook}
          onClick={book}
          className="inline-flex items-center justify-center gap-2 h-10 w-full rounded-[var(--radius-card)] btn-primary text-sm font-semibold"
        >
          {busy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-ink)] border-t-transparent" aria-hidden />}
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
        <div className="inline-flex gap-1 rounded-[var(--radius-card)] border-2 border-ink bg-bg p-0.5 shadow-[2px_2px_0px_0px_var(--ink)]">
          {(["calendar", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={[
                "rounded-[calc(var(--radius-card)-4px)] px-3 py-1 text-xs font-bold transition-colors",
                view === v ? "bg-[var(--primary)] text-ink shadow-[1px_1px_0px_0px_var(--ink)]" : "text-ink-2 hover:text-ink",
              ].join(" ")}
            >
              {v === "calendar" ? "ปฏิทิน" : "รายการ"}
            </button>
          ))}
        </div>
      </div>

      {view === "calendar" ? (
        <CalendarView interviews={upcoming} nameByApp={nameByApp} />
      ) : upcoming.length === 0 ? (
        <div className="loga-card rounded-[var(--radius-card)] border-2 border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-ink-3">
          ยังไม่มีนัดสัมภาษณ์ — สร้างนัดแรกจากฟอร์มด้านซ้าย
        </div>
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

const WEEKDAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Full month grid (LOGA style) with prev/next navigation, so HR sees the whole month's
 *  load before picking a slot — not just a scrolling agenda of upcoming days. */
function CalendarView({ interviews, nameByApp }: { interviews: Interview[]; nameByApp: NameByApp }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Interview[]>();
    for (const iv of interviews) {
      const key = dayKey(new Date(iv.scheduledAt));
      (map.get(key) ?? map.set(key, []).get(key)!).push(iv);
    }
    return map;
  }, [interviews]);

  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cursor]);

  const today = new Date();

  return (
    <div className="loga-card rounded-[var(--radius-card)] border bg-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          aria-label="เดือนก่อนหน้า"
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-card)] border border-border text-ink-2 hover:bg-surface-2"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-ink">
            {cursor.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
          </h4>
          {!isSameDay(cursor, new Date(today.getFullYear(), today.getMonth(), 1)) && (
            <button
              type="button"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-ink-2 hover:bg-surface-2"
            >
              วันนี้
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
          aria-label="เดือนถัดไป"
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-card)] border border-border text-ink-2 hover:bg-surface-2"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-semibold text-ink-3">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flatMap((row, ri) =>
          row.map((day, di) => {
            if (!day) return <div key={`${ri}-${di}`} className="min-h-[4.5rem]" />;
            const items = byDay.get(dayKey(day)) ?? [];
            const isToday = isSameDay(day, today);
            return (
              <div
                key={`${ri}-${di}`}
                className={[
                  "flex min-h-[4.5rem] flex-col gap-0.5 rounded-md border p-1 text-left",
                  isToday ? "border-primary bg-primary-soft" : "border-border bg-bg",
                ].join(" ")}
              >
                <span className={["text-[11px] font-semibold", isToday ? "text-primary-ink" : "text-ink-3"].join(" ")}>
                  {day.getDate()}
                </span>
                {items.slice(0, 2).map((iv) => (
                  <span
                    key={iv.id}
                    title={`${nameByApp.get(iv.applicationId) ?? "ผู้สมัคร"} — ${new Date(iv.scheduledAt).toLocaleTimeString("th-TH", { timeStyle: "short" })}`}
                    className="truncate rounded bg-primary/20 px-1 text-[10px] font-medium text-ink"
                  >
                    {new Date(iv.scheduledAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} {nameByApp.get(iv.applicationId) ?? "ผู้สมัคร"}
                  </span>
                ))}
                {items.length > 2 && <span className="text-[10px] text-ink-3">+{items.length - 2} อื่นๆ</span>}
              </div>
            );
          }),
        )}
      </div>
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
    try {
      await cancelInterview(iv.id, iv.googleEventId);
    } catch {
      setError("ยกเลิกนัดไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  async function saveReschedule() {
    setBusy(true);
    setError(null);
    try {
      const r = await rescheduleInterview(
        { interviewId: iv.id, startsAt: new Date(newAt).toISOString(), durationMin: iv.durationMin },
        iv.googleEventId,
      );
      if (r.ok) {
        setRescheduling(false);
        setNewAt("");
      } else setError(r.error);
    } catch {
      setError("เลื่อนนัดไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
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
            className="inline-flex items-center gap-2 h-9 rounded-[var(--radius-card)] btn-primary px-3 text-sm font-semibold"
          >
            {busy && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--primary-ink)] border-t-transparent" aria-hidden />}
            {busy ? "กำลังเลื่อน…" : "ยืนยันเวลาใหม่"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
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
