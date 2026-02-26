import { STATUS_KEYS, isStatusKey, getBoardColumn, type StatusKey, type BoardColumnKey } from "src/entities/application/model/status";

export type MatchTimestampsLike = {
  status: StatusKey;
  createdAt: unknown;
  updatedAt: unknown;
  loopId?: string | undefined;
};

export type Bucket = {
  label: string;
  startMs: number;
  endMs: number;
  counts: Record<StatusKey, number>;
};


export function parseMs(v: unknown): number | null {
  if (v == null) return null;

  if (typeof v === "number" && Number.isFinite(v)) return v;

  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }

  // Firestore Timestamp-like: { seconds, nanoseconds } or { toMillis() }
  if (isTimestampWithToMillis(v)) {
    const n = v.toMillis();
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  }
  if (isTimestampWithSeconds(v)) {
    return Math.round(v.seconds * 1000);
  }

  return null;
}

type TimestampWithToMillis = { toMillis: () => unknown };
type TimestampWithSeconds = { seconds: number; nanoseconds?: number };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isTimestampWithToMillis(v: unknown): v is TimestampWithToMillis {
  if (!isRecord(v)) return false;
  return typeof v.toMillis === "function";
}

function isTimestampWithSeconds(v: unknown): v is TimestampWithSeconds {
  if (!isRecord(v)) return false;
  return typeof v.seconds === "number" && Number.isFinite(v.seconds);
}

export function diffDays(aMs: number, bMs: number): number {
  const d = Math.abs(bMs - aMs);
  return Math.round(d / (24 * 60 * 60 * 1000));
}

export function medianDays(values: number[]): number | null {
  const xs = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 === 1 ? xs[mid] : Math.round((xs[mid - 1] + xs[mid]) / 2);
}

export function normalizeAppStatus(s: unknown): StatusKey {
  return isStatusKey(s) ? s : "SAVED";
}

function emptyCounts(): Record<StatusKey, number> {
  const out = {} as Record<StatusKey, number>;
  for (const k of STATUS_KEYS) out[k] = 0;
  return out;
}

function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeekMs(ms: number): number {
  const d = new Date(startOfDayMs(ms));
  const day = d.getDay(); // 0 Sun
  const diff = (day + 6) % 7; // Mon=0
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

function fmtDayLabel(ms: number, locale: string): string {
  const d = new Date(ms);
  return new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit" }).format(d);
}

function fmtMonthLabel(ms: number, locale: string): string {
  const d = new Date(ms);
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
}

function fmtWeekLabel(ms: number, locale: string): string {
  const d = new Date(ms);
  // "Wk 12" style could be nicer, but keep stable: "dd MMM"
  return new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit" }).format(d);
}

export function buildDailyBuckets(matches: MatchTimestampsLike[], opts: { days: number; byUpdatedAt: boolean; locale: string }): Bucket[] {
  const now = Date.now();
  const end = startOfDayMs(now) + 24 * 60 * 60 * 1000;
  const start = end - opts.days * 24 * 60 * 60 * 1000;

  const buckets: Bucket[] = [];
  for (let i = 0; i < opts.days; i++) {
    const bStart = start + i * 24 * 60 * 60 * 1000;
    const bEnd = bStart + 24 * 60 * 60 * 1000;
    buckets.push({
      label: fmtDayLabel(bStart, opts.locale),
      startMs: bStart,
      endMs: bEnd,
      counts: emptyCounts(),
    });
  }

  for (const m of matches) {
    const ts = parseMs(opts.byUpdatedAt ? m.updatedAt : m.createdAt);
    if (ts == null) continue;
    if (ts < start || ts >= end) continue;
    const idx = Math.floor((startOfDayMs(ts) - start) / (24 * 60 * 60 * 1000));
    const b = buckets[idx];
    if (!b) continue;
    const st = normalizeAppStatus(m.status);
    b.counts[st] += 1;
  }

  return buckets;
}

export function buildWeeklyBuckets(matches: MatchTimestampsLike[], opts: { weeks: number; byUpdatedAt: boolean; locale: string }): Bucket[] {
  const now = Date.now();
  const end = startOfWeekMs(now) + 7 * 24 * 60 * 60 * 1000;
  const start = end - opts.weeks * 7 * 24 * 60 * 60 * 1000;

  const buckets: Bucket[] = [];
  for (let i = 0; i < opts.weeks; i++) {
    const bStart = start + i * 7 * 24 * 60 * 60 * 1000;
    const bEnd = bStart + 7 * 24 * 60 * 60 * 1000;
    buckets.push({
      label: fmtWeekLabel(bStart, opts.locale),
      startMs: bStart,
      endMs: bEnd,
      counts: emptyCounts(),
    });
  }

  for (const m of matches) {
    const ts = parseMs(opts.byUpdatedAt ? m.updatedAt : m.createdAt);
    if (ts == null) continue;
    if (ts < start || ts >= end) continue;
    const idx = Math.floor((startOfWeekMs(ts) - start) / (7 * 24 * 60 * 60 * 1000));
    const b = buckets[idx];
    if (!b) continue;
    const st = normalizeAppStatus(m.status);
    b.counts[st] += 1;
  }

  return buckets;
}

export function buildMonthlyBuckets(matches: MatchTimestampsLike[], opts: { months: number; byUpdatedAt: boolean; locale: string }): Bucket[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(); // next month start
  const startDate = new Date(now.getFullYear(), now.getMonth() - (opts.months - 1), 1);
  const start = startDate.getTime();

  const buckets: Bucket[] = [];
  for (let i = 0; i < opts.months; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const bStart = d.getTime();
    const bEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    buckets.push({
      label: fmtMonthLabel(bStart, opts.locale),
      startMs: bStart,
      endMs: bEnd,
      counts: emptyCounts(),
    });
  }

  for (const m of matches) {
    const ts = parseMs(opts.byUpdatedAt ? m.updatedAt : m.createdAt);
    if (ts == null) continue;
    if (ts < start || ts >= end) continue;
    const d = new Date(ts);
    const idx = (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth());
    const b = buckets[idx];
    if (!b) continue;
    const st = normalizeAppStatus(m.status);
    b.counts[st] += 1;
  }

  return buckets;
}

export type PipelineLinePoint = { label: string; value: number };

/**
 * Для линии “Pipeline” используем суммы по колонкам доски,
 * а не прямые ключи статусов.
 */
export function bucketToPipelineLine(buckets: Bucket[]): PipelineLinePoint[] {
  const pipelineCols: ReadonlySet<BoardColumnKey> = new Set([
    "ACTIVE",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
    "NO_RESPONSE"
  ]);

  return buckets.map((b) => {
    let total = 0;
    for (const k of STATUS_KEYS) {
      const col = getBoardColumn(k);
      if (pipelineCols.has(col)) total += b.counts[k] || 0;
    }
    return { label: b.label, value: total };
  });
}

