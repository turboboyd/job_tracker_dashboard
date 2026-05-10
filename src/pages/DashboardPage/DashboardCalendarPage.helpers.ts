import type { DashboardPlanItem } from "./model/dashboardAggregations";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardCalendarDay {
  count: number;
  date: Date;
  dateKey: string;
  isSelected: boolean;
  isToday: boolean;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addCalendarDays(date: Date, days: number): Date {
  return new Date(startOfLocalDay(date).getTime() + days * DAY_MS);
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getPlanItemDate(item: DashboardPlanItem): Date | null {
  if (!item.nextActionAt) return null;

  const maybe = item.nextActionAt as { toDate?: unknown };
  const date =
    typeof maybe.toDate === "function"
      ? (maybe.toDate as () => Date)()
      : new Date(item.nextActionAt as never);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function getCalendarWeekStart(date: Date): Date {
  const dayIndex = (date.getDay() + 6) % 7;
  return addCalendarDays(date, -dayIndex);
}

export function buildCalendarWeekDays(
  items: DashboardPlanItem[],
  selectedDate: Date,
  now = new Date(),
): DashboardCalendarDay[] {
  const weekStart = getCalendarWeekStart(selectedDate);
  const selectedKey = getLocalDateKey(selectedDate);
  const todayKey = getLocalDateKey(now);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addCalendarDays(weekStart, index);
    const dateKey = getLocalDateKey(date);

    return {
      count: countCalendarItemsByDate(items, date),
      date,
      dateKey,
      isSelected: dateKey === selectedKey,
      isToday: dateKey === todayKey,
    };
  });
}

export function filterCalendarItemsByDate(
  items: DashboardPlanItem[],
  date: Date,
): DashboardPlanItem[] {
  const dateKey = getLocalDateKey(date);

  return items.filter((item) => {
    const itemDate = getPlanItemDate(item);
    return itemDate ? getLocalDateKey(itemDate) === dateKey : false;
  });
}

export function filterOverdueCalendarItems(
  items: DashboardPlanItem[],
): DashboardPlanItem[] {
  return items.filter((item) => item.bucket === "overdue");
}

export function countCalendarItemsByDate(
  items: DashboardPlanItem[],
  date: Date,
): number {
  return filterCalendarItemsByDate(items, date).length;
}

export function countCalendarItemsInWeek(
  items: DashboardPlanItem[],
  selectedDate: Date,
): number {
  const weekStart = getCalendarWeekStart(selectedDate).getTime();
  const weekEnd = weekStart + 7 * DAY_MS;

  return items.filter((item) => {
    const itemDate = getPlanItemDate(item);
    if (!itemDate) return false;

    const time = startOfLocalDay(itemDate).getTime();
    return time >= weekStart && time < weekEnd;
  }).length;
}
