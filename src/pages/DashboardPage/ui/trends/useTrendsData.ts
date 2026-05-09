import { useMemo } from "react";

import {
  STATUS_KEYS,
  type StatusKey,
  getBoardColumn,
  type BoardColumnKey,
} from "src/entities/application";

import { buildDailyBuckets, type Bucket } from "../../model/dashboardTimeSeries";

import { clampDayStart, isoDay, rangeDays, type CustomRangeMs } from "./trends.helpers";
import type { ModeKey, RangeKey, TrendsPoint } from "./trends.types";

// Keep hooks pure: take a stable "now" snapshot at module init for preset ranges.
const NOW_MS = Date.now();

export function useTrendsBuckets(
  matches: { status: StatusKey; createdAt: number; updatedAt: number }[],
  range: RangeKey,
  mode: ModeKey,
  customRange: CustomRangeMs,
) {
  return useMemo(() => {
    const byUpdatedAt = mode === "updated";

    if (range === "custom" && customRange?.fromMs && customRange?.toMs) {
      const fromMs = clampDayStart(customRange.fromMs);
      const toMs = clampDayStart(customRange.toMs);

      const days = Math.max(1, Math.ceil((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1);

      const buckets = buildDailyBuckets(matches, {
        days,
        byUpdatedAt,
        locale: "en",
      });

      return buckets.filter((b) => b.startMs >= fromMs && b.startMs <= toMs);
    }

    const preset = range as Exclude<RangeKey, "custom">;
    const days = rangeDays(preset);

    const buckets = buildDailyBuckets(matches, {
      days,
      byUpdatedAt,
      locale: "en",
    });

    const from = NOW_MS - days * 24 * 60 * 60 * 1000;
    return buckets.filter((b) => b.startMs >= from);
  }, [matches, mode, range, customRange]);
}

export function useTrendsTotal(buckets: Bucket[]) {
  return useMemo(() => {
    let total = 0;
    for (const b of buckets) {
      for (const k of STATUS_KEYS) total += b.counts[k] ?? 0;
    }
    return total;
  }, [buckets]);
}

export function useTrendsChartData(buckets: Bucket[], _locale: string) {
  return useMemo(() => {
    const sumCol = (counts: Record<StatusKey, number>, col: BoardColumnKey) => {
      let n = 0;
      for (const k of STATUS_KEYS) {
        if (getBoardColumn(k) === col) n += counts[k] ?? 0;
      }
      return n;
    };

    const points: TrendsPoint[] = buckets.map((b) => {
      const ACTIVE = sumCol(b.counts, "ACTIVE");
      const INTERVIEW = sumCol(b.counts, "INTERVIEW");
      const OFFER = sumCol(b.counts, "OFFER");
      const HIRED = sumCol(b.counts, "HIRED");
      const REJECTED = sumCol(b.counts, "REJECTED");
      const NO_RESPONSE = sumCol(b.counts, "NO_RESPONSE");
      const total = ACTIVE + INTERVIEW + OFFER + HIRED + REJECTED + NO_RESPONSE;
      return {
        date: isoDay(b.startMs),
        ACTIVE,
        INTERVIEW,
        OFFER,
        HIRED,
        REJECTED,
        NO_RESPONSE,
        total,
      };
    });

    return { points };
  }, [buckets]);
}
