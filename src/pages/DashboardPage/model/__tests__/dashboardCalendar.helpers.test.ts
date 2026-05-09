import assert from "node:assert/strict";

import {
  buildCalendarWeekDays,
  countCalendarItemsInWeek,
  filterCalendarItemsByDate,
  filterOverdueCalendarItems,
  getCalendarWeekStart,
  getLocalDateKey,
} from "../../DashboardCalendarPage.helpers";
import type { DashboardPlanItem } from "../dashboardAggregations";

function test(_name: string, run: () => void) {
  run();
}

function planItem(
  id: string,
  date: string,
  bucket: DashboardPlanItem["bucket"] = "today",
): DashboardPlanItem {
  const sortMs = new Date(date).getTime();

  return {
    bucket,
    company: "Company",
    id,
    isOverdue: bucket === "overdue",
    isToday: bucket === "today",
    isTomorrow: bucket === "tomorrow",
    nextActionAt: date,
    nextActionText: null,
    sortMs,
    status: "APPLIED",
    title: "Role",
  };
}

test("buildCalendarWeekDays starts on Monday and counts items by local day", () => {
  const selected = new Date("2026-05-20T12:00:00");
  const days = buildCalendarWeekDays(
    [
      planItem("monday", "2026-05-18T09:00:00"),
      planItem("selected-1", "2026-05-20T09:00:00"),
      planItem("selected-2", "2026-05-20T15:00:00"),
    ],
    selected,
    selected,
  );

  assert.equal(getLocalDateKey(getCalendarWeekStart(selected)), "2026-05-18");
  assert.equal(days[0]?.dateKey, "2026-05-18");
  assert.equal(days[2]?.dateKey, "2026-05-20");
  assert.equal(days[2]?.count, 2);
  assert.equal(days[2]?.isSelected, true);
});

test("filters selected day, overdue and week counts", () => {
  const selected = new Date("2026-05-20T12:00:00");
  const items = [
    planItem("overdue", "2026-05-19T09:00:00", "overdue"),
    planItem("selected", "2026-05-20T09:00:00"),
    planItem("outside-week", "2026-05-25T09:00:00", "upcoming"),
  ];

  assert.deepEqual(
    filterCalendarItemsByDate(items, selected).map((item) => item.id),
    ["selected"],
  );
  assert.deepEqual(
    filterOverdueCalendarItems(items).map((item) => item.id),
    ["overdue"],
  );
  assert.equal(countCalendarItemsInWeek(items, selected), 2);
});
