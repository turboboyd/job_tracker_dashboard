import type { Loop } from "src/entities/loop";
import type {
  DiscoveryRunPreviewItem,
  DiscoveryRunResponse,
} from "src/features/discoveryRuns";
import type {
  DuplicateStatus,
  VacancyMatch,
  VacancyMatchEvaluation,
  VacancyMatchListEnvelope,
  VacancyMatchStatus,
} from "src/features/vacancyMatches";

export const MATCHES_V2_PAGE_SIZE = 20;
export const MATCHES_V2_PER_LOOP_FETCH_CAP = 200;

export type StatusTab = "all" | VacancyMatchStatus;
export type SortKey = "match" | "posted" | "company" | "loop";

/** Origin of a synthesized preview match (the live discovery item it stands for). */
export interface MatchPreviewOrigin {
  sourceId: string;
  item: DiscoveryRunPreviewItem;
}

export interface MatchWithLoopName {
  loopName: string;
  match: VacancyMatch;
  /** True when `match` is synthesized from a live discovery preview (not yet persisted). */
  isPreview?: boolean;
  /** Present only for preview rows — the raw discovery item, used for save/ignore. */
  preview?: MatchPreviewOrigin;
}

/** Drop trailing "/" chars without a regex (sonarjs/slow-regex-safe). */
function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47 /* "/" */) end -= 1;
  return value.slice(0, end);
}

/**
 * Stable identity for cross-source/run dedup: prefer (source, externalId); fall
 * back to (source, normalized URL) when the source omits an external id. Shared
 * by persisted matches and synthesized previews so a freshly-saved match and its
 * still-cached preview collapse to one row.
 */
export function getMatchDedupeKey(match: VacancyMatch): string {
  const source = normalize(match.source);
  const externalId = normalize(match.externalId);
  if (externalId) return `${source}:id:${externalId}`;
  const url = stripTrailingSlashes(normalize(match.sourceUrl));
  return `${source}:url:${url}`;
}

/**
 * Build a display-only `VacancyMatch` from a live discovery preview item so it can
 * flow through the same list/detail/filter/sort pipeline as persisted matches.
 * The synthetic id is prefixed `preview:` so callers can tell it apart and avoid
 * hitting match-id-bound endpoints (evaluate/analysis/convert) before it's saved.
 */
export function previewItemToMatch(
  loopId: string,
  sourceId: string,
  item: DiscoveryRunPreviewItem,
): VacancyMatch {
  const postedAt =
    item.postedAt && !Number.isNaN(Date.parse(item.postedAt)) ? item.postedAt : null;
  const timestamp = postedAt ?? new Date().toISOString();
  const rawMetadata: Record<string, unknown> = {
    ...item.rawMetadata,
    ...(postedAt ? { posted_at: postedAt } : {}),
  };
  // Surface the relevance score under `score` so getMatchScore ranks previews
  // alongside persisted matches.
  const confidence: Record<string, number> = {
    ...item.confidence,
    ...(item.insight ? { score: item.insight.score } : {}),
  };
  return {
    id: `preview:${loopId}:${sourceId}:${item.externalId ?? item.sourceUrl}`,
    userId: "",
    loopId,
    sourceUrl: item.sourceUrl,
    source: sourceId || null,
    externalId: item.externalId,
    companyName: item.company,
    roleTitle: item.title,
    locationText: item.location,
    vacancyDescription: item.snippet,
    rawMetadata,
    confidence,
    warnings: [],
    status: "new",
    applicationId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** A per-loop persisted-matches page paired with the loop it came from. */
export interface LoopMatchesResult {
  loop: Loop;
  response: VacancyMatchListEnvelope;
}

/** A per-loop live discovery preview paired with its loop; `null` on fetch failure. */
export interface LoopPreviewResult {
  loop: Loop;
  response: DiscoveryRunResponse | null;
}

export interface MergedMatchesFeed {
  items: MatchWithLoopName[];
  /** Sources still warming server-side; caller may schedule a retry when > 0. */
  warmingCount: number;
}

/**
 * A per-loop predicate that keeps only vacancies from the sources the user has
 * enabled on that loop (`selectedSources`). When a loop has no sources selected
 * (legacy/unconfigured), we impose no constraint and show everything — that's the
 * safe default that can't accidentally blank out a loop's feed.
 */
function makeSourceFilter(loop: Loop): (source: string | null | undefined) => boolean {
  const allowed = (loop.selectedSources ?? [])
    .map((s) => normalize(s))
    .filter((s) => s.length > 0);
  if (allowed.length === 0) return () => true;
  const allowedSet = new Set(allowed);
  return (source) => allowedSet.has(normalize(source));
}

function collectPersistedMatches(
  dbResults: readonly LoopMatchesResult[],
  merged: MatchWithLoopName[],
  seen: Set<string>,
): void {
  for (const { loop, response } of dbResults) {
    const loopName = getLoopDisplayName(loop);
    const allowsSource = makeSourceFilter(loop);
    for (const match of response.items) {
      if (!allowsSource(match.source)) continue;
      const key = getMatchDedupeKey(match);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({ loopName, match });
    }
  }
}

function collectPreviewItems(
  loop: Loop,
  loopName: string,
  sourceId: string,
  previewItems: readonly DiscoveryRunPreviewItem[],
  merged: MatchWithLoopName[],
  seen: Set<string>,
): void {
  for (const previewItem of previewItems) {
    const match = previewItemToMatch(loop.id, sourceId, previewItem);
    const key = getMatchDedupeKey(match);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      loopName,
      match,
      isPreview: true,
      preview: { sourceId, item: previewItem },
    });
  }
}

function collectPreviewMatches(
  previewResults: readonly LoopPreviewResult[],
  merged: MatchWithLoopName[],
  seen: Set<string>,
): number {
  let warmingCount = 0;
  for (const { loop, response } of previewResults) {
    if (!response) continue;
    const loopName = getLoopDisplayName(loop);
    const allowsSource = makeSourceFilter(loop);
    for (const runItem of response.items) {
      const sourceId = runItem.sourceId ?? "";
      if (!allowsSource(sourceId)) continue;
      if (runItem.reason === "cache_warming") {
        warmingCount += 1;
        continue;
      }
      collectPreviewItems(loop, loopName, sourceId, runItem.previewItems, merged, seen);
    }
  }
  return warmingCount;
}

/**
 * Merge persisted matches (source of truth) with a live discovery "добор" so the
 * feed shows the full set of vacancies found per loop — not just the saved few.
 * The backend already drops saved/handled items from the preview, so the streams
 * don't double-count; we still dedupe by (source, externalId|url) defensively in
 * case a freshly-saved match is still cached. Returns the merged rows plus the
 * count of sources still warming so the caller can decide whether to poll again.
 */
export function buildMergedMatchesFeed(
  dbResults: readonly LoopMatchesResult[],
  previewResults: readonly LoopPreviewResult[],
): MergedMatchesFeed {
  const merged: MatchWithLoopName[] = [];
  const seen = new Set<string>();
  collectPersistedMatches(dbResults, merged, seen);
  const warmingCount = collectPreviewMatches(previewResults, merged, seen);
  return { items: merged, warmingCount };
}

export const STATUS_TAB_LABELS: Record<StatusTab, string> = {
  all: "Все",
  new: "Новые",
  saved: "Сохранённые",
  converted: "Отклики",
  ignored: "Скрытые",
};

export const STATUS_PILL_LABEL: Record<VacancyMatchStatus, string> = {
  new: "Новая",
  saved: "Сохранено",
  converted: "Отклик",
  ignored: "Скрыто",
};

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "posted", label: "Сначала свежие" },
  { value: "match", label: "По матч-скору" },
  { value: "company", label: "По компании (A–Z)" },
  { value: "loop", label: "По циклу" },
];

const SOURCE_LABELS: Record<string, string> = {
  arbeitsagentur: "Arbeitsagentur",
  arbeitnow: "Arbeitnow",
  adzuna: "Adzuna",
  remotive: "Remotive",
  remotejobs: "RemoteJobs",
  himalayas: "Himalayas",
  remoteok: "Remote OK",
  greenhouse: "Greenhouse",
  lever: "Lever",
  linkedin: "LinkedIn",
  stepstone: "StepStone",
  indeed: "Indeed",
  xing: "XING",
  glassdoor: "Glassdoor",
  honeypot: "Honeypot",
  wellfound: "Wellfound",
  monster: "Monster",
  jobware: "Jobware",
  joblift: "Joblift",
  kimeta: "Kimeta",
  jobvector: "Jobvector",
};

const SOURCE_COLORS: Record<string, string> = {
  arbeitsagentur: "#d8232a",
  arbeitnow: "#0a66c2",
  adzuna: "#7c3aed",
  remotive: "#0caa41",
  remotejobs: "#2164f3",
  himalayas: "#06b6d4",
  remoteok: "#000000",
  greenhouse: "#22863a",
  lever: "#5b6cff",
  linkedin: "#0a66c2",
  stepstone: "#005c5c",
  indeed: "#2164f3",
  xing: "#006567",
  glassdoor: "#0caa41",
  honeypot: "#ff6600",
  wellfound: "#000000",
  monster: "#6a3fb5",
  jobware: "#e23",
  joblift: "#0070ff",
  kimeta: "#04a4f4",
  jobvector: "#1b6dc1",
};

const FALLBACK_SOURCE_COLOR = "#6b7280";

export function getSourceLabel(sourceId: string | null | undefined): string {
  if (!sourceId) return "Другое";
  if (SOURCE_LABELS[sourceId]) return SOURCE_LABELS[sourceId];
  return sourceId.charAt(0).toUpperCase() + sourceId.slice(1);
}

export function getSourceColor(sourceId: string | null | undefined): string {
  if (!sourceId) return FALLBACK_SOURCE_COLOR;
  return SOURCE_COLORS[sourceId] ?? FALLBACK_SOURCE_COLOR;
}

export function getLoopDisplayName(loop: Loop): string {
  return (loop.title || loop.name || loop.targetRole || loop.id).trim() || loop.id;
}

export function getMatchScore(match: VacancyMatch): number | null {
  const raw = match.confidence?.score ?? match.confidence?.overall ?? match.confidence?.match;
  return typeof raw === "number" ? Math.round(raw) : null;
}

export function getMatchScoreOrZero(match: VacancyMatch): number {
  return getMatchScore(match) ?? 0;
}

/**
 * Freshness rank in epoch-ms: real source publish date when known
 * (`getVacancyMeta().postedAt`), else the row's `createdAt`. Unparseable
 * timestamps collapse to 0 so they sink to the bottom of a "freshest first" sort.
 */
export function getMatchFreshnessTs(match: VacancyMatch): number {
  const postedAt = getVacancyMeta(match).postedAt;
  const ts = Date.parse(postedAt ?? match.createdAt);
  return Number.isNaN(ts) ? 0 : ts;
}

export function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Whether a row is "unseen" — i.e. belongs in the «Новые» tab. Live preview rows
 * (the live добор, not yet persisted) are always unseen. Persisted matches are
 * unseen until the user marks the list seen: a match counts as unseen when it
 * was created after the watermark, or whenever the user has never marked the
 * list (watermark null → everything is new).
 */
export function isMatchUnseen(
  item: Pick<MatchWithLoopName, "isPreview" | "match">,
  watermark: string | null,
): boolean {
  if (item.isPreview) return true;
  if (!watermark) return true;
  const seen = Date.parse(watermark);
  if (Number.isNaN(seen)) return true;
  const created = Date.parse(item.match.createdAt);
  if (Number.isNaN(created)) return false;
  return created > seen;
}

/** Whether a row belongs in the given status tab. «Новые» means "unseen". */
function passesStatusTab(
  item: MatchWithLoopName,
  status: StatusTab,
  watermark: string | null,
): boolean {
  if (status === "all") return true;
  if (status === "new") return isMatchUnseen(item, watermark);
  return item.match.status === status;
}

export function filterMatches(
  items: readonly MatchWithLoopName[],
  args: {
    q: string;
    source: string;
    status: StatusTab;
    loopId: string;
    watermark: string | null;
  },
): MatchWithLoopName[] {
  const q = normalize(args.q);
  const source = normalize(args.source);
  return items.filter((entry) => {
    const { match, loopName } = entry;
    if (args.loopId && match.loopId !== args.loopId) return false;
    if (!passesStatusTab(entry, args.status, args.watermark)) return false;
    if (source && normalize(match.source) !== source) return false;
    if (!q) return true;

    const haystack = [
      match.roleTitle,
      match.companyName,
      match.locationText,
      match.sourceUrl,
      loopName,
    ]
      .map((part) => normalize(part))
      .join(" ");
    return haystack.includes(q);
  });
}

export function sortMatches(
  items: readonly MatchWithLoopName[],
  sort: SortKey,
): MatchWithLoopName[] {
  const copy = [...items];
  if (sort === "company") {
    copy.sort((left, right) =>
      String(left.match.companyName ?? "").localeCompare(
        String(right.match.companyName ?? ""),
        undefined,
        { sensitivity: "base" },
      ),
    );
    return copy;
  }
  if (sort === "loop") {
    copy.sort((left, right) => left.loopName.localeCompare(right.loopName, undefined, { sensitivity: "base" }));
    return copy;
  }
  if (sort === "posted") {
    copy.sort((left, right) => getMatchFreshnessTs(right.match) - getMatchFreshnessTs(left.match));
    return copy;
  }
  copy.sort((left, right) => getMatchScoreOrZero(right.match) - getMatchScoreOrZero(left.match));
  return copy;
}

/**
 * Tab counts for the status bar. «Все» is the total; saved/converted/ignored are
 * by persisted status; «Новые» counts *unseen* rows (preview + matches created
 * after the watermark) — not the legacy status==="new" set.
 */
export function countMatchesByStatus(
  items: readonly MatchWithLoopName[],
  watermark: string | null,
): Record<StatusTab, number> {
  const counts: Record<StatusTab, number> = {
    all: 0,
    new: 0,
    saved: 0,
    converted: 0,
    ignored: 0,
  };
  for (const item of items) {
    counts.all += 1;
    const status = item.match.status;
    if (status === "saved" || status === "converted" || status === "ignored") {
      counts[status] += 1;
    }
    if (isMatchUnseen(item, watermark)) counts.new += 1;
  }
  return counts;
}

export interface SourceBucket {
  key: string;
  label: string;
  color: string;
  count: number;
}

export function getSourceBuckets(items: readonly MatchWithLoopName[]): SourceBucket[] {
  const counts = new Map<string, number>();
  for (const { match } of items) {
    const key = match.source ?? "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: getSourceLabel(key === "other" ? null : key),
      color: getSourceColor(key === "other" ? null : key),
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

export function formatRelativeTime(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (!iso) return "—";
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "—";
  const diffMs = nowMs - time;
  if (diffMs < 0) return "только что";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} д назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес назад`;
  return `${Math.floor(days / 365)} г назад`;
}

export function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export interface LoopSyncState {
  isActive: boolean;
  label: string;
}

export function getLoopSyncState(loop: Loop): LoopSyncState {
  const paused = loop.status === "paused" || loop.status === "archived";
  const disabled = loop.autoDiscoveryEnabled === false;
  if (paused || disabled) {
    return { isActive: false, label: "Синхронизация на паузе" };
  }
  return { isActive: true, label: "Синхронизация активна" };
}

export function getLoopPlatformCount(loop: Loop): number {
  const fromSelected = loop.selectedSources?.length ?? 0;
  const fromPlatforms = loop.platforms?.length ?? 0;
  const fromSources = loop.sources?.length ?? 0;
  return Math.max(fromSelected, fromPlatforms, fromSources);
}

/** Human duration until a future timestamp, or null when missing/past/invalid. */
export function formatTimeUntil(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const diffMs = time - nowMs;
  if (diffMs <= 0) return null;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "меньше минуты";
  if (minutes < 60) return `${minutes} ${pluralRu(minutes, "минуту", "минуты", "минут")}`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24) {
    return restMinutes > 0 ? `${hours} ч ${restMinutes} мин` : `${hours} ч`;
  }
  const days = Math.floor(hours / 24);
  return `${days} ${pluralRu(days, "день", "дня", "дней")}`;
}

/** MM:SS (or HH:MM:SS) countdown to a future timestamp; "00:00" when reached, null when missing. */
export function formatCountdownClock(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const totalSeconds = Math.max(0, Math.floor((time - nowMs) / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Subtitle line for a single-loop view: "N вакансий · M платформ · обновлено … · следующий запуск через …". */
export function buildLoopMetaLine(
  loop: Loop,
  vacancyCount: number,
  nowMs: number = Date.now(),
): string {
  const parts: string[] = [
    `${vacancyCount} ${pluralRu(vacancyCount, "вакансия", "вакансии", "вакансий")}`,
  ];
  const platforms = getLoopPlatformCount(loop);
  if (platforms > 0) {
    parts.push(`${platforms} ${pluralRu(platforms, "платформа", "платформы", "платформ")}`);
  }
  if (loop.lastDiscoveryAt) {
    parts.push(`обновлено ${formatRelativeTime(loop.lastDiscoveryAt, nowMs)}`);
  }
  const until = formatTimeUntil(loop.nextRunAt, nowMs);
  if (until) {
    parts.push(`следующий запуск через ${until}`);
  }
  return parts.join(" · ");
}

export function getMatchInitial(match: VacancyMatch): string {
  const company = (match.companyName ?? "").trim();
  if (company) return company.charAt(0).toUpperCase();
  const role = (match.roleTitle ?? "").trim();
  if (role) return role.charAt(0).toUpperCase();
  return "?";
}

export function getMatchTags(match: VacancyMatch): string[] {
  const raw = match.rawMetadata;
  if (!raw) return [];
  const candidate = raw.tags ?? raw.skills ?? raw.keywords;
  if (Array.isArray(candidate)) {
    return candidate
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .slice(0, 6);
  }
  return [];
}

// --- Vacancy meta (salary / work mode / employment / posted date) ----------
// Backend stores heterogeneous keys in `raw_metadata` (per discovery adapter):
//   Adzuna   → contract_type, category
//   Arbeitnow→ remote (bool), job_types[], tags[]
//   …plus posted_at is merged in when a preview is saved as a match.
// We read whatever exists and gracefully omit anything missing. Salary is not
// yet populated by any adapter, so that chip stays empty until backend maps it.

type RawMeta = Record<string, unknown>;

function rawString(raw: RawMeta, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (Array.isArray(value)) {
      const first = value.find((entry) => typeof entry === "string" && entry.trim().length > 0);
      if (typeof first === "string") return first.trim();
    }
  }
  return null;
}

function rawNumber(raw: RawMeta, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^\d.]/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}

function capitalizeWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMoney(value: number): string {
  if (value >= 1000) {
    const rounded = Math.round((value / 1000) * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}k` : `${rounded.toFixed(1)}k`;
  }
  return String(Math.round(value));
}

function isPredictedSalary(raw: RawMeta): boolean {
  const value = raw.salary_is_predicted ?? raw.salaryIsPredicted;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
  }
  return false;
}

interface SalaryInfo {
  text: string | null;
  /** True when the source flags the figure as an estimate (e.g. Adzuna). */
  estimated: boolean;
}

function formatSalary(raw: RawMeta): SalaryInfo {
  const explicit = rawString(raw, ["salary", "salary_text", "salaryText", "compensation", "pay"]);
  if (explicit) return { text: explicit, estimated: false };
  const min = rawNumber(raw, ["salary_min", "salaryMin", "min_salary", "minSalary"]);
  const max = rawNumber(raw, ["salary_max", "salaryMax", "max_salary", "maxSalary"]);
  const currency = rawString(raw, ["salary_currency", "salaryCurrency", "currency"]);
  const suffix = currency ? ` ${currency}` : "";
  const estimated = isPredictedSalary(raw);
  const mark = estimated ? "≈" : "";
  if (min !== null && max !== null) {
    return { text: `${mark}${formatMoney(min)}–${formatMoney(max)}${suffix}`, estimated };
  }
  if (min !== null) return { text: `от ${mark}${formatMoney(min)}${suffix}`, estimated };
  if (max !== null) return { text: `до ${mark}${formatMoney(max)}${suffix}`, estimated };
  return { text: null, estimated: false };
}

function normalizeWorkMode(value: string): string {
  const v = value.toLowerCase();
  if (/(remote|удал|home[\s_-]?office|homeoffice)/.test(v)) return "Удалённо";
  if (/(hybrid|гибрид|teilremote)/.test(v)) return "Гибрид";
  if (/(on[\s_-]?site|office|офис|vor ort|büro|on-premise)/.test(v)) return "Офис";
  return capitalizeWord(value);
}

function formatWorkMode(raw: RawMeta): string | null {
  if (raw.remote === true) return "Удалённо";
  const value = rawString(raw, [
    "work_mode",
    "workMode",
    "remote_mode",
    "remoteMode",
    "workplace_type",
    "workplaceType",
  ]);
  return value ? normalizeWorkMode(value) : null;
}

function normalizeEmployment(value: string): string {
  const v = value.toLowerCase();
  if (/(intern|praktik|werkstudent|trainee)/.test(v)) return "Стажировка";
  if (/(part[\s_-]?time|teilzeit)/.test(v)) return "Частичная занятость";
  if (/(full[\s_-]?time|vollzeit|festanstellung|permanent|unbefristet)/.test(v)) {
    return "Полная занятость";
  }
  if (/(temporary|\btemp\b|befristet|interim)/.test(v)) return "Временная";
  if (/(contract|freelance|freiberuf|contractor)/.test(v)) return "Контракт";
  return capitalizeWord(value);
}

function formatEmployment(raw: RawMeta): string | null {
  const value = rawString(raw, [
    "employment_type",
    "employmentType",
    "job_type",
    "jobType",
    "job_types",
    "jobTypes",
    "contract_type",
    "contractType",
  ]);
  return value ? normalizeEmployment(value) : null;
}

function getPostedAtIso(raw: RawMeta): string | null {
  const value = rawString(raw, ["posted_at", "postedAt", "published_at", "publishedAt", "date"]);
  if (value && !Number.isNaN(Date.parse(value))) return value;
  return null;
}

export interface VacancyMeta {
  /** Salary range/text when a source provides it (currently rare). */
  salary: string | null;
  /** True when the salary is a source-side estimate (rendered with "≈"). */
  salaryEstimated: boolean;
  /** "Удалённо" / "Гибрид" / "Офис" / raw label, when known. */
  workMode: string | null;
  /** "Полная занятость" / "Контракт" / … when known. */
  employment: string | null;
  /** Real source-published ISO timestamp, or null (never createdAt). */
  postedAt: string | null;
}

export function getVacancyMeta(match: VacancyMatch): VacancyMeta {
  const raw = (match.rawMetadata ?? {}) as RawMeta;
  const salary = formatSalary(raw);
  return {
    salary: salary.text,
    salaryEstimated: salary.estimated,
    workMode: formatWorkMode(raw),
    employment: formatEmployment(raw),
    postedAt: getPostedAtIso(raw),
  };
}

export interface VacancyMetaChip {
  key: "salary" | "workMode" | "employment" | "posted";
  label: string;
  /** Optional hover hint, e.g. an explanation of the "≈" estimate mark. */
  title?: string;
}

const ESTIMATED_SALARY_HINT = "Оценка зарплаты по данным источника, не из вакансии напрямую";

/** Ordered, ready-to-render chips; only entries the source actually provides. */
export function getVacancyMetaChips(
  match: VacancyMatch,
  nowMs: number = Date.now(),
): VacancyMetaChip[] {
  const meta = getVacancyMeta(match);
  const chips: VacancyMetaChip[] = [];
  if (meta.salary) {
    chips.push(
      meta.salaryEstimated
        ? { key: "salary", label: meta.salary, title: ESTIMATED_SALARY_HINT }
        : { key: "salary", label: meta.salary },
    );
  }
  if (meta.workMode) chips.push({ key: "workMode", label: meta.workMode });
  if (meta.employment) chips.push({ key: "employment", label: meta.employment });
  if (meta.postedAt) {
    chips.push({ key: "posted", label: `Опубликовано ${formatRelativeTime(meta.postedAt, nowMs)}` });
  }
  return chips;
}

// --- Deterministic evaluation (server /evaluate) localization + verdict -----
// The backend returns English, structured reason/penalty strings. We localize
// the known patterns into Russian and fall back to the raw string otherwise.

function stripTrailingDot(value: string): string {
  return value.replace(/\.$/, "").trim();
}

export function localizeEvaluationReason(reason: string): string {
  const titlePrefix = "Role title matches Loop target terms:";
  if (reason.startsWith(titlePrefix)) {
    return `Должность совпадает с целью цикла: ${stripTrailingDot(reason.slice(titlePrefix.length))}`;
  }
  const keywordPrefix = "Matched keyword:";
  if (reason.startsWith(keywordPrefix)) {
    return `Совпало ключевое слово: ${stripTrailingDot(reason.slice(keywordPrefix.length))}`;
  }
  if (reason.startsWith("Location matches Loop location")) return "Локация совпадает с циклом";
  if (reason.startsWith("Source is selected for this Loop")) return "Источник включён в цикл";
  if (reason.startsWith("No excluded keywords found")) return "Стоп-слов не найдено";
  return reason;
}

export function localizeEvaluationPenalty(penalty: string): string {
  const keywordPrefix = "Matched excluded keyword:";
  if (penalty.startsWith(keywordPrefix)) {
    return `Найдено стоп-слово: ${stripTrailingDot(penalty.slice(keywordPrefix.length))}`;
  }
  if (penalty.startsWith("Source is not selected for this Loop")) {
    return "Источник не выбран в цикле";
  }
  return penalty;
}

export type EvaluationTone = "positive" | "neutral" | "caution";

export interface EvaluationVerdict {
  tone: EvaluationTone;
  title: string;
  detail: string;
}

const DUPLICATE_LABEL: Record<DuplicateStatus, string> = {
  none: "",
  possible_duplicate: "Возможный дубликат",
  likely_duplicate: "Вероятный дубликат",
  exact_duplicate: "Точный дубликат",
};

export function getDuplicateLabel(status: DuplicateStatus): string | null {
  return DUPLICATE_LABEL[status] || null;
}

export function getEvaluationVerdict(evaluation: VacancyMatchEvaluation): EvaluationVerdict {
  const { totalScore, penalties, duplicateStatus } = evaluation;
  if (duplicateStatus === "exact_duplicate") {
    return {
      tone: "caution",
      title: "Похоже на дубликат",
      detail: "Эта вакансия уже есть в ваших матчах или заявках.",
    };
  }
  if (totalScore >= 75 && penalties.length === 0) {
    return {
      tone: "positive",
      title: "Скорее да",
      detail: `Сильное соответствие фильтрам цикла (${totalScore}/100) без стоп-факторов.`,
    };
  }
  if (totalScore >= 50) {
    return {
      tone: "neutral",
      title: "Стоит изучить",
      detail: `Среднее соответствие фильтрам цикла (${totalScore}/100). Проверьте детали.`,
    };
  }
  return {
    tone: "caution",
    title: "Слабое совпадение",
    detail: `Низкое соответствие фильтрам цикла (${totalScore}/100). Возможны расхождения с фильтрами.`,
  };
}
