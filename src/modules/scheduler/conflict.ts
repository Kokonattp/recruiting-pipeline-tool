import type { Interview } from "@/lib/types";

/** A time slot under consideration, plus the existing interviews to check against. */
export interface SlotCheck {
  startsAt: Date;
  durationMin: number;
}

export interface Conflict {
  interviewId: string;
  startsAt: string;
  overlapMinutes: number;
}

/** End time of an interview/slot given start + duration. */
function endOf(start: Date, durationMin: number): Date {
  return new Date(start.getTime() + durationMin * 60_000);
}

/** Minutes of overlap between two intervals (0 if they don't overlap). */
function overlapMinutes(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  return end > start ? Math.round((end - start) / 60_000) : 0;
}

/**
 * Pure conflict detection: does the proposed slot overlap any existing interview?
 * Cancelled interviews are ignored. Returns every overlapping interview so the UI can
 * explain exactly what clashes. Kept side-effect free so it's unit-testable and reused
 * for both the in-app check and (later) the Google Calendar busy check.
 */
export function findConflicts(slot: SlotCheck, existing: Interview[]): Conflict[] {
  const slotEnd = endOf(slot.startsAt, slot.durationMin);
  const conflicts: Conflict[] = [];

  for (const iv of existing) {
    if (iv.status === "CANCELLED") continue;
    const ivStart = new Date(iv.scheduledAt);
    const ivEnd = endOf(ivStart, iv.durationMin);
    const minutes = overlapMinutes(slot.startsAt, slotEnd, ivStart, ivEnd);
    if (minutes > 0) {
      conflicts.push({
        interviewId: iv.id,
        startsAt: iv.scheduledAt,
        overlapMinutes: minutes,
      });
    }
  }
  return conflicts;
}
