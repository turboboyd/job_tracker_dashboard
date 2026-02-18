import type { SeriesKey } from "./trends.types";

export const SERIES: SeriesKey[] = ["applied", "interview", "offer", "rejected"];

export const LEGEND_COLOR: Record<SeriesKey, string> = {
  applied: "rgb(14 165 233)", // sky-500
  interview: "rgb(139 92 246)", // violet-500
  offer: "rgb(16 185 129)", // emerald-500
  rejected: "rgb(244 63 94)", // rose-500
};

// Make overlapping series visible without distorting data:
// dashed series are easier to distinguish even when values are identical.
export const DASH: Partial<Record<SeriesKey, string>> = {
  interview: "6 4",
  rejected: "6 4",
};

export function toNumberSafe(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatLabel(
  dateMs: number,
  locale: string,
  range: "7d" | "30d" | "90d" | "12m",
): string {
  const d = new Date(dateMs);

  if (range === "12m") {
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
  }

  if (range === "7d") {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
  }

  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(d);
}
