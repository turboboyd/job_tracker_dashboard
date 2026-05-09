import assert from "node:assert/strict";

import { buildGoogleCalendarPlanCandidates } from "../googleCalendarPlanCandidates";

function test(_name: string, run: () => void) {
  run();
}

test("buildGoogleCalendarPlanCandidates keeps event id for browser update", () => {
  const candidates = buildGoogleCalendarPlanCandidates(
    [
      {
        id: "app-1",
        data: {
          integrations: {
            googleCalendar: {
              eventId: "event-1",
            },
          },
          job: {
            companyName: "NovaSoft",
            locationText: "Berlin",
            roleTitle: "Frontend Developer",
          },
          process: {
            nextActionAt: "2026-05-20T10:00:00Z",
            nextActionText: "Call back",
          },
        },
      },
    ],
    Date.parse("2026-05-01T09:00:00Z"),
    "https://app.example.com/dashboard/applications",
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.googleCalendarEventId, "event-1");
  assert.equal(candidates[0]?.location, "Berlin");
});
