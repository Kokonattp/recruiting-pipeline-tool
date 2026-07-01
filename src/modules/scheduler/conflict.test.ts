import { describe, it, expect } from "vitest";
import { findConflicts } from "./conflict";
import type { Interview } from "@/lib/types";

function interview(overrides: Partial<Interview>): Interview {
  return {
    id: "iv-1",
    applicationId: "app-1",
    scheduledAt: "2026-07-01T10:00:00.000Z",
    durationMin: 30,
    googleEventId: null,
    meetLink: null,
    status: "SCHEDULED",
    notes: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("findConflicts", () => {
  it("returns no conflicts against an empty interview list", () => {
    const slot = { startsAt: new Date("2026-07-01T10:00:00.000Z"), durationMin: 30 };
    expect(findConflicts(slot, [])).toEqual([]);
  });

  it("detects a fully overlapping slot", () => {
    const existing = [interview({ id: "iv-1", scheduledAt: "2026-07-01T10:00:00.000Z", durationMin: 30 })];
    const slot = { startsAt: new Date("2026-07-01T10:00:00.000Z"), durationMin: 30 };
    const conflicts = findConflicts(slot, existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ interviewId: "iv-1", overlapMinutes: 30 });
  });

  it("detects a partially overlapping slot and reports the overlap minutes", () => {
    const existing = [interview({ id: "iv-1", scheduledAt: "2026-07-01T10:00:00.000Z", durationMin: 30 })];
    // New slot starts 15 min into the existing one -> 15 min overlap.
    const slot = { startsAt: new Date("2026-07-01T10:15:00.000Z"), durationMin: 30 };
    const conflicts = findConflicts(slot, existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlapMinutes).toBe(15);
  });

  it("does not flag back-to-back slots (end == start) as a conflict", () => {
    const existing = [interview({ id: "iv-1", scheduledAt: "2026-07-01T10:00:00.000Z", durationMin: 30 })];
    const slot = { startsAt: new Date("2026-07-01T10:30:00.000Z"), durationMin: 30 };
    expect(findConflicts(slot, existing)).toEqual([]);
  });

  it("does not flag non-overlapping slots on the same day", () => {
    const existing = [interview({ id: "iv-1", scheduledAt: "2026-07-01T10:00:00.000Z", durationMin: 30 })];
    const slot = { startsAt: new Date("2026-07-01T14:00:00.000Z"), durationMin: 30 };
    expect(findConflicts(slot, existing)).toEqual([]);
  });

  it("ignores CANCELLED interviews", () => {
    const existing = [
      interview({ id: "iv-1", scheduledAt: "2026-07-01T10:00:00.000Z", durationMin: 30, status: "CANCELLED" }),
    ];
    const slot = { startsAt: new Date("2026-07-01T10:00:00.000Z"), durationMin: 30 };
    expect(findConflicts(slot, existing)).toEqual([]);
  });

  it("returns every overlapping interview, not just the first", () => {
    const existing = [
      interview({ id: "iv-1", scheduledAt: "2026-07-01T10:00:00.000Z", durationMin: 60 }),
      interview({ id: "iv-2", scheduledAt: "2026-07-01T10:30:00.000Z", durationMin: 30 }),
    ];
    const slot = { startsAt: new Date("2026-07-01T10:15:00.000Z"), durationMin: 60 };
    const conflicts = findConflicts(slot, existing);
    expect(conflicts.map((c) => c.interviewId).sort()).toEqual(["iv-1", "iv-2"]);
  });
});
