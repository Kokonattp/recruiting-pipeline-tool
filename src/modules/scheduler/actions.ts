"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUrl, createCalendarEvent, cancelCalendarEvent } from "@/lib/google";

/**
 * Scheduler actions: connect Google, create an interview (real Calendar event + Meet
 * link), and cancel one. Creating an interview also advances the application to
 * FIRST_INTERVIEW so the Tracker stays in sync. The refresh token lives in an
 * httpOnly cookie set by the OAuth callback.
 */

export type SchedResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Whether Google is connected (cookie present). */
export async function isGoogleConnected(): Promise<boolean> {
  const jar = await cookies();
  return Boolean(jar.get("google_refresh_token")?.value);
}

/** URL to start the Google OAuth consent flow. */
export async function getGoogleAuthUrl(): Promise<SchedResult<string>> {
  try {
    return { ok: true, data: getAuthUrl() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Google OAuth ยังไม่ได้ตั้งค่า" };
  }
}

const CreateInput = z.object({
  applicationId: z.string().min(1, "เลือกผู้สมัคร"),
  startsAt: z.string().min(1, "เลือกวันเวลา"),
  durationMin: z.number().int().positive(),
  summary: z.string().min(1),
  description: z.string(),
  attendeeEmails: z.array(z.string().email()),
});

export async function createInterview(input: z.input<typeof CreateInput>): Promise<SchedResult> {
  const parsed = CreateInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const jar = await cookies();
  const refreshToken = jar.get("google_refresh_token")?.value;
  if (!refreshToken) return { ok: false, error: "ยังไม่ได้เชื่อม Google Calendar" };

  const { applicationId, startsAt, durationMin, summary, description, attendeeEmails } = parsed.data;

  try {
    const event = await createCalendarEvent({
      refreshToken,
      summary,
      description,
      startsAt: new Date(startsAt),
      durationMin,
      attendeeEmails,
    });

    const db = supabaseAdmin();
    const { error: e1 } = await db.from("interviews").insert({
      application_id: applicationId,
      scheduled_at: startsAt,
      duration_min: durationMin,
      google_event_id: event.eventId,
      meet_link: event.meetLink,
      status: "SCHEDULED",
    });
    if (e1) return { ok: false, error: e1.message };

    // sync the pipeline: an interview means the candidate reached the interview stage
    await db.from("applications").update({ stage: "FIRST_INTERVIEW" }).eq("id", applicationId);

    revalidatePath("/scheduler");
    revalidatePath("/tracker");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "สร้างนัดไม่สำเร็จ" };
  }
}

/** Cancel an interview: delete the Google event + mark CANCELLED. */
export async function cancelInterview(interviewId: string, googleEventId: string | null): Promise<SchedResult> {
  const jar = await cookies();
  const refreshToken = jar.get("google_refresh_token")?.value;

  try {
    if (refreshToken && googleEventId) {
      await cancelCalendarEvent(refreshToken, googleEventId).catch(() => {});
    }
    const { error } = await supabaseAdmin()
      .from("interviews")
      .update({ status: "CANCELLED" })
      .eq("id", interviewId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/scheduler");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ยกเลิกนัดไม่สำเร็จ" };
  }
}
