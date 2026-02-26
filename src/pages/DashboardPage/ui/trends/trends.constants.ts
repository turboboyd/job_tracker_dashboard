import type { RangeKey, SeriesKey } from "./trends.types";

export const SERIES: SeriesKey[] = [
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "NO_RESPONSE",
];

export const SERIES_LABELS: Record<SeriesKey, string> = {
  ACTIVE: "Active",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  NO_RESPONSE: "No response",
};

export const LEGEND_COLOR: Record<SeriesKey, string> = {
  // Unified status colors (same as dots/badges/charts in the whole app)
  ACTIVE: "rgb(var(--status-info))",
  INTERVIEW: "rgb(var(--status-purple))",
  OFFER: "rgb(var(--status-warning))",
  HIRED: "rgb(var(--status-success))",
  REJECTED: "rgb(var(--status-danger))",
  NO_RESPONSE: "rgb(var(--status-neutral))",
};

export const DASH: Record<SeriesKey, string | undefined> = {
  ACTIVE: undefined,
  INTERVIEW: "6 4",
  OFFER: "2 3",
  HIRED: "10 4",
  REJECTED: "3 2",
  NO_RESPONSE: "1 3",
};

export const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  "12m": "12m",
  custom: "custom"
};

export function toNumberSafe(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}.${m}`;
}
