import assert from "node:assert/strict";

import { createGoogleCalendarProvider } from "../googleCalendarProvider";
import type { GoogleCalendarEventPayload } from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

const payload: GoogleCalendarEventPayload = {
  description: "Reason: Call back",
  end: { dateTime: "2026-05-20T10:30:00.000Z" },
  reminders: {
    overrides: [{ method: "popup", minutes: 10 }],
    useDefault: false,
  },
  source: {
    title: "Job Tracker Dashboard",
    url: "https://app.example.com/dashboard/applications/app-1",
  },
  start: { dateTime: "2026-05-20T10:00:00.000Z" },
  summary: "Frontend Developer / NovaSoft",
};

test("createGoogleCalendarProvider creates events through Calendar API", async () => {
  let method = "";
  let url = "";
  let authorization = "";
  const provider = createGoogleCalendarProvider({
    accessToken: "token",
    calendarId: "primary",
    endpoint: "https://calendar.test",
    fetchImpl: async (requestUrl, init) => {
      url = requestUrl instanceof Request ? requestUrl.url : String(requestUrl);
      method = String(init?.method);
      authorization = String((init?.headers as Record<string, string>).Authorization);

      return new Response(JSON.stringify({ htmlLink: "https://calendar/event", id: "event-1" }));
    },
  });

  const event = await provider.createEvent(payload);

  assert.equal(method, "POST");
  assert.equal(url, "https://calendar.test/calendars/primary/events");
  assert.equal(authorization, "Bearer token");
  assert.deepEqual(event, {
    htmlLink: "https://calendar/event",
    id: "event-1",
  });
});

test("createGoogleCalendarProvider updates and deletes events", async () => {
  const methods: string[] = [];
  const provider = createGoogleCalendarProvider({
    accessToken: "token",
    endpoint: "https://calendar.test",
    fetchImpl: async (_requestUrl, init) => {
      methods.push(String(init?.method));
      return new Response(JSON.stringify({ id: "event-1" }));
    },
  });

  await provider.updateEvent("event-1", payload);
  await provider.deleteEvent("event-1");

  assert.deepEqual(methods, ["PATCH", "DELETE"]);
});

test("createGoogleCalendarProvider throws provider errors", async () => {
  const provider = createGoogleCalendarProvider({
    accessToken: "token",
    fetchImpl: async () => new Response("bad token", { status: 401 }),
  });

  await assert.rejects(
    provider.createEvent(payload),
    /Google Calendar POST failed: 401 bad token/,
  );
});
