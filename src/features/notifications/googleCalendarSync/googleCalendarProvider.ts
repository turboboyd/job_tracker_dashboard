import type {
  GoogleCalendarEventPayload,
  GoogleCalendarProvider,
  GoogleCalendarSyncedEvent,
} from "./types";

interface GoogleCalendarProviderConfig {
  accessToken: string;
  calendarId?: string | undefined;
  endpoint?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
}

interface GoogleCalendarApiEventResponse {
  htmlLink?: string;
  id?: string;
}

export function createGoogleCalendarProvider({
  accessToken,
  calendarId = "primary",
  endpoint = "https://www.googleapis.com/calendar/v3",
  fetchImpl = fetch,
}: GoogleCalendarProviderConfig): GoogleCalendarProvider {
  const eventsUrl = `${endpoint}/calendars/${encodeURIComponent(calendarId)}/events`;

  return {
    async createEvent(payload) {
      return requestCalendarEvent(fetchImpl, eventsUrl, accessToken, {
        body: payload,
        method: "POST",
      });
    },
    async deleteEvent(eventId) {
      const response = await fetchImpl(`${eventsUrl}/${encodeURIComponent(eventId)}`, {
        headers: buildHeaders(accessToken),
        method: "DELETE",
      });

      if (!response.ok && response.status !== 410) {
        throw new Error(
          `Google Calendar delete failed: ${response.status} ${await response.text()}`,
        );
      }
    },
    async updateEvent(eventId, payload) {
      return requestCalendarEvent(
        fetchImpl,
        `${eventsUrl}/${encodeURIComponent(eventId)}`,
        accessToken,
        {
          body: payload,
          method: "PATCH",
        },
      );
    },
  };
}

async function requestCalendarEvent(
  fetchImpl: typeof fetch,
  url: string,
  accessToken: string,
  request: {
    body: GoogleCalendarEventPayload;
    method: "PATCH" | "POST";
  },
): Promise<GoogleCalendarSyncedEvent> {
  const response = await fetchImpl(url, {
    body: JSON.stringify(request.body),
    headers: buildHeaders(accessToken),
    method: request.method,
  });

  if (!response.ok) {
    throw new Error(
      `Google Calendar ${request.method} failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = await readCalendarResponse(response);
  if (!data.id) {
    throw new Error("Google Calendar response did not include an event id");
  }

  return {
    id: data.id,
    ...(data.htmlLink ? { htmlLink: data.htmlLink } : {}),
  };
}

function buildHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function readCalendarResponse(
  response: Response,
): Promise<GoogleCalendarApiEventResponse> {
  const parsed: unknown = await response.json().catch(() => ({}));
  if (!isRecord(parsed)) return {};

  return {
    ...(typeof parsed.htmlLink === "string" ? { htmlLink: parsed.htmlLink } : {}),
    ...(typeof parsed.id === "string" ? { id: parsed.id } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
