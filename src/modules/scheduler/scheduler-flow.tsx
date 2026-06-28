"use client";

import { useMemo, useState } from "react";
import type { ApplicationWithRelations, Interview } from "@/lib/types";
import { findConflicts, type Conflict } from "./conflict";
import { createInterview, cancelInterview, getGoogleAuthUrl } from "./actions";

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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const conflicts: Conflict[] = useMemo(() => {
    if (!datetime) return [];
    const startsAt = new Date(datetime);
    if (Number.isNaN(startsAt.getTime())) return [];
    return findConflicts({ startsAt, durationMin: duration }, interviews);
  }, [datetime, duration, interviews]);

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
      attendeeEmails: cand.candidate.email ? [cand.candidate.email] : [],
    });
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: "ok", text: "สร้างนัด + Google Meet สำเร็จ — sync เข้า Tracker แล้ว" });
      setDatetime("");
    } else setMsg({ kind: "err", text: r.error });
  }

  if (!googleConnected) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-ink">เชื่อมต่อ Google Calendar ก่อน</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
          อนุญาตให้ระบบสร้างนัดสัมภาษณ์ในปฏิทินของคุณ พร้อม Meet link และส่ง invite อัตโนมัติ
        </p>
        <button
          type="button"
          onClick={connect}
          className="mt-5 h-10 rounded-[var(--radius-card)] bg-primary px-5 text-sm font-medium text-primary-ink hover:opacity-90"
        >
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
            className="h-10 w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">ระยะเวลา</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="h-10 w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm text-ink focus:border-primary focus:outline-none"
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

        <button
          type="button"
          disabled={!canBook}
          onClick={book}
          className="h-10 w-full rounded-[var(--radius-card)] bg-primary text-sm font-medium text-primary-ink hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "กำลังสร้างนัด…" : "สร้างนัด + Google Meet"}
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ink">นัดที่กำลังจะถึง</h3>
        <AgendaList interviews={interviews} />
      </div>
    </div>
  );
}

function AgendaList({ interviews }: { interviews: Interview[] }) {
  const upcoming = interviews
    .filter((i) => i.status !== "CANCELLED")
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  if (upcoming.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface-2/60 px-4 py-10 text-center text-sm text-ink-3">
        ยังไม่มีนัดสัมภาษณ์ — สร้างนัดแรกจากฟอร์มด้านซ้าย
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {upcoming.map((iv) => (
        <li
          key={iv.id}
          className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface p-3"
        >
          <div>
            <div className="text-sm font-medium text-ink">
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
            <CancelButton id={iv.id} eventId={iv.googleEventId} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function CancelButton({ id, eventId }: { id: string; eventId: string | null }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await cancelInterview(id, eventId);
        setBusy(false);
      }}
      className="text-xs text-ink-3 hover:text-[var(--danger)]"
    >
      {busy ? "…" : "ยกเลิก"}
    </button>
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
        className="h-10 w-full rounded-[var(--radius-card)] border border-border bg-bg px-2.5 text-sm text-ink focus:border-primary focus:outline-none"
      >
        {options.length === 0 && <option value="">— ยังไม่มีผู้สมัครในระบบ —</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
