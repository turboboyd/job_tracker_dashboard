export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

export function startOfDayMs(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

export function startOfWeekMs(timestamp: number): number {
  const date = new Date(startOfDayMs(timestamp));
  const dayOfWeek = date.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  date.setDate(date.getDate() - daysSinceMonday);

  return date.getTime();
}

export function formatDayLabel(timestamp: number, locale: string): string {
  return formatDateLabel(timestamp, locale, {
    day: "2-digit",
    month: "short",
  });
}

export function formatMonthLabel(timestamp: number, locale: string): string {
  return formatDateLabel(timestamp, locale, { month: "short" });
}

function formatDateLabel(
  timestamp: number,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(timestamp));
}

