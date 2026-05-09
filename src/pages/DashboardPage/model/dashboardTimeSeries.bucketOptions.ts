export interface TimeSeriesBaseOptions {
  byUpdatedAt: boolean;
  locale: string;
}

export interface DailyBucketOptions extends TimeSeriesBaseOptions {
  days: number;
}

export interface WeeklyBucketOptions extends TimeSeriesBaseOptions {
  weeks: number;
}

export interface MonthlyBucketOptions extends TimeSeriesBaseOptions {
  months: number;
}

export interface FixedWindowBucketConfig {
  bucketCount: number;
  bucketSizeMs: number;
  byUpdatedAt: boolean;
  locale: string;
  rangeStartMs: number;
  rangeEndMs: number;
  bucketStartMsForTimestamp: (timestamp: number) => number;
  labelFormatter: (bucketStartMs: number, locale: string) => string;
}

export interface MonthlyBucketWindow {
  endMs: number;
  label: string;
  startMs: number;
}

