import { google, type calendar_v3 } from "googleapis";

/**
 * Google Calendar + Meet helper (Module 4).
 *
 * Creates real calendar events with an auto-generated Meet link via `conferenceData`.
 * OAuth credentials come from env; the user connects their Google account once and we
 * store the refresh token. Until credentials are configured, these throw a clear error
 * that the actions surface to the UI rather than crashing.
 */

function oauthClient() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  if (!id || !secret || !redirect) {
    throw new Error("ยังไม่ได้ตั้งค่า Google OAuth (GOOGLE_CLIENT_ID / SECRET / REDIRECT_URI)");
  }
  return new google.auth.OAuth2(id, secret, redirect);
}

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

/** URL to send the user to so they can grant calendar access. */
export function getAuthUrl(): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

/** Exchange the OAuth callback code for tokens (incl. refresh_token). */
export async function exchangeCode(code: string) {
  const { tokens } = await oauthClient().getToken(code);
  return tokens;
}

function calendarFor(refreshToken: string): calendar_v3.Calendar {
  const auth = oauthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth });
}

export interface CreateEventInput {
  refreshToken: string;
  summary: string;
  description: string;
  startsAt: Date;
  durationMin: number;
  attendeeEmails: string[];
}

export interface CreatedEvent {
  eventId: string;
  meetLink: string | null;
  htmlLink: string | null;
}

/** Create a calendar event with a Google Meet conference attached. */
export async function createCalendarEvent(input: CreateEventInput): Promise<CreatedEvent> {
  const cal = calendarFor(input.refreshToken);
  const end = new Date(input.startsAt.getTime() + input.durationMin * 60_000);

  const res = await cal.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1, // required for Meet link generation
    sendUpdates: "all",
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startsAt.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: input.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const event = res.data;
  const meetLink =
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? null;

  return { eventId: event.id ?? "", meetLink, htmlLink: event.htmlLink ?? null };
}

/** Cancel (delete) a previously created event. */
export async function cancelCalendarEvent(refreshToken: string, eventId: string): Promise<void> {
  await calendarFor(refreshToken).events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  });
}
