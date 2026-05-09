import { toMillis } from "src/shared/lib";

import type { MatchTimestampsLike } from "../../model/dashboardTimeSeries";

import type { CustomRange, CustomRangeValue, RangeKey, VisibleMap } from "./trends.types";

export type CustomRangeMs = { fromMs: number; toMs: number } | null;

const DAY_MS = 24 * 60 * 60 * 1000;

export const INITIAL_VISIBLE_SERIES: VisibleMap = {
  ACTIVE: true,
  INTERVIEW: true,
  OFFER: true,
  HIRED: true,
  REJECTED: true,
  NO_RESPONSE: false,
};

export interface SafeTrendMatch {
  status: MatchTimestampsLike["status"];
  createdAt: number;
  updatedAt: number;
}

export interface CustomRangeDraft {
  from: string;
  to: string;
}

export interface TrendsSubtitleInput {
  customRange: CustomRange;
  language: string;
  modeLabel: string;
  range: RangeKey;
  rangeLabel: string;
}

export function rangeDays(range: Exclude<RangeKey, "custom">): number {
  if (range === "12m") return 365;
  if (range === "90d") return 90;
  if (range === "30d") return 30;
  return 7;
}

export function clampDayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isoDay(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function formatShortDate(d: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function parseDateInput(value: string): Date | null {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toSafeTrendMatches(matches: MatchTimestampsLike[]): SafeTrendMatch[] {
  return matches
    .map((match) => {
      const createdAt = toMillis(match.createdAt);
      const updatedAt = toMillis(match.updatedAt) || createdAt;

      return {
        status: match.status,
        createdAt,
        updatedAt,
      };
    })
    .filter((match) => match.createdAt > 0);
}

export function getCustomRangeMs(range: RangeKey, customRange: CustomRange): CustomRangeMs {
  if (range !== "custom" || !customRange) return null;

  return {
    fromMs: customRange.from.getTime(),
    toMs: customRange.to.getTime(),
  };
}

export function getCustomRangeDraft(customRange: CustomRange, now = new Date()): CustomRangeDraft {
  const to = customRange?.to ?? now;
  const from = customRange?.from ?? new Date(now.getTime() - 6 * DAY_MS);

  return {
    from: formatDateInput(from),
    to: formatDateInput(to),
  };
}

export function normalizeCustomRange(from: Date, to: Date): CustomRangeValue {
  return from.getTime() <= to.getTime() ? { from, to } : { from: to, to: from };
}

export function buildTrendsSubtitle({
  customRange,
  language,
  modeLabel,
  range,
  rangeLabel,
}: TrendsSubtitleInput): string {
  if (range === "custom" && customRange) {
    const from = formatShortDate(customRange.from, language);
    const to = formatShortDate(customRange.to, language);

    return `${modeLabel} - ${from}-${to}`;
  }

  return `${modeLabel} - ${rangeLabel}`;
}
