"use client";

import { useMemo, useState } from "react";
import type { Interview } from "@/lib/types";
import { findConflicts, type Conflict } from "./conflict";

/**
 * Interview Scheduler container. HR picks a date/time + duration; the form runs
 * conflict detection against existing interviews in real time (pure `findConflicts`,
 * no round-trip) and warns before booking. Creating the event (Google Calendar + Meet)
 * is a Server Action wired at link time. Existing interviews come from the DB.
 */
export function SchedulerFlow({ interviews }: { interviews: Interview[] }) {
  const [datetime, setDatetime] = useState("");
  const [duration, setDuration] = useState(30);

  const conflicts: Conflict[] = useMemo(() => {
    if (!datetime) return [];
    const startsAt = new Date(datetime);
    if (Number.isNaN(startsAt.getTime())) return [];
    return findConflicts({ startsAt, durationMin: duration }, interviews);
  }, [datetime, duration, interviews]);

  const canBook = datetime !== "" && conflicts.length === 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* booking form */}
      <div className="space-y-4">
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
            <ul className="mt-1 text-xs text-ink-2">
              {conflicts.map((c) => (
                <li key={c.interviewId}>
                  ซ้อน {c.overlapMinutes} นาที กับนัด {new Date(c.startsAt).toLocaleString("th-TH")}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          disabled={!canBook}
          className="h-10 w-full rounded-[var(--radius-card)] bg-primary text-sm font-medium text-primary-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          สร้างนัด + Google Meet
        </button>
        <p className="text-xs text-ink-3">
          ระบบจะสร้าง event ใน Google Calendar พร้อม Meet link และส่ง invite อัตโนมัติ
        </p>
      </div>

      {/* agenda */}
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
              {new Date(iv.scheduledAt).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
            <div className="text-xs text-ink-3">{iv.durationMin} นาที · {iv.status}</div>
          </div>
          {iv.meetLink && (
            <a
              href={iv.meetLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              เข้า Meet
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
