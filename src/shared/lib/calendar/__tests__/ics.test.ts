import assert from "node:assert/strict";

import {
  buildIcsCalendar,
  sanitizeIcsFileName,
} from "../ics";

function test(_name: string, run: () => void) {
  run();
}

test("buildIcsCalendar creates a valid event with escaped text", () => {
  const calendar = buildIcsCalendar({
    now: new Date("2026-05-20T08:00:00Z"),
    title: "Plan, applications",
    events: [
      {
        description: "Call back\nAsk about salary, contract; remote",
        startsAt: new Date("2026-05-20T10:00:00Z"),
        title: "Frontend, React; NovaSoft",
        uid: "app-1-20260520",
        url: "https://example.com/applications/app-1",
      },
    ],
  });

  assert.match(calendar, /^BEGIN:VCALENDAR\r\n/);
  assert.match(calendar, /SUMMARY:Frontend\\, React\\; NovaSoft/);
  assert.match(calendar, /DESCRIPTION:Call back\\nAsk about salary\\, contract\\; remote/);
  assert.match(calendar, /DTSTART:20260520T100000Z/);
  assert.match(calendar, /DTEND:20260520T103000Z/);
  assert.match(calendar, /END:VCALENDAR\r\n$/);
});

test("buildIcsCalendar supports multiple events and custom duration", () => {
  const calendar = buildIcsCalendar({
    events: [
      {
        durationMinutes: 45,
        startsAt: new Date("2026-05-20T10:00:00Z"),
        title: "First",
        uid: "first",
      },
      {
        startsAt: new Date("2026-05-20T12:00:00Z"),
        title: "Second",
        uid: "second",
      },
    ],
  });

  assert.equal(calendar.match(/BEGIN:VEVENT/g)?.length, 2);
  assert.match(calendar, /DTEND:20260520T104500Z/);
  assert.match(calendar, /DTEND:20260520T123000Z/);
});

test("sanitizeIcsFileName keeps downloads predictable", () => {
  assert.equal(
    sanitizeIcsFileName("  Junior Frontend / NovaSoft.ics "),
    "junior-frontend-novasoft.ics",
  );
  assert.equal(sanitizeIcsFileName("!!!"), "application-plan.ics");
});
