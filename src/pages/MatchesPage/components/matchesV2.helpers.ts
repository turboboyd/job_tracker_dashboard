import { getDiscoverySourcePriority, type Loop } from "src/entities/loop";
import type {
  DuplicateStatus,
  ScoreReasonEntry,
  VacancyMatch,
  VacancyMatchEvaluation,
  VacancyMatchStatus,
} from "src/features/vacancyMatches";

export const MATCHES_V2_PAGE_SIZE = 20;

export type StatusTab = "all" | "new" | "saved";
export type SortKey = "posted" | "company" | "loop";

/**
 * A persisted vacancy match paired with its loop's display name. This is the
 * exact shape the backend feed returns per row (`MatchesFeedItem`), so the page
 * maps the feed straight into this type with no client-side merge/filter/sort.
 */
export interface MatchWithLoopName {
  loopName: string;
  match: VacancyMatch;
}

export const STATUS_TAB_LABELS: Record<StatusTab, string> = {
  all: "Все",
  new: "Новые",
  saved: "Сохранённые",
};

export const STATUS_PILL_LABEL: Record<VacancyMatchStatus, string> = {
  new: "Новая",
  saved: "Сохранено",
  converted: "Заявка создана",
};

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "posted", label: "Сначала свежие" },
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

/**
 * Whether a loop's vacancies belong in the Matches feed. Paused and archived
 * loops are hidden entirely — their matches reappear only once the loop is
 * resumed. A loop with no explicit status (legacy/default) counts as active.
 */
export function isLoopVisibleInMatches(loop: Loop): boolean {
  return loop.status !== "paused" && loop.status !== "archived";
}

export function getMatchScore(match: VacancyMatch): number | null {
  // Prefer the backend-owned persisted score (Stage 6c). The legacy
  // confidence.* keys are a transitional fallback for rows persisted before the
  // top-level score existed. The frontend never computes a score itself.
  if (typeof match.score === "number") return Math.round(match.score);
  const legacy = match.confidence?.score ?? match.confidence?.overall ?? match.confidence?.match;
  return typeof legacy === "number" ? Math.round(legacy) : null;
}

/** True once the user has viewed this match (server-stamped `seenAt`). */
export function isMatchSeen(match: Pick<VacancyMatch, "seenAt">): boolean {
  return Boolean(match.seenAt);
}

export interface SourceBucket {
  key: string;
  label: string;
  color: string;
  /** Optional count; omitted for the server-driven feed (no per-source totals). */
  count?: number;
}

/**
 * Source filter chips for the Matches strip, built from the union of sources the
 * visible loops have enabled (`selectedSources`). The server feed is paginated
 * and carries no per-source totals, so these are pure filters without counts.
 */
export function buildSourceBuckets(loops: readonly Loop[]): SourceBucket[] {
  const keys = new Set<string>();
  for (const loop of loops) {
    for (const source of loop.selectedSources ?? []) {
      const key = source.trim().toLowerCase();
      if (key) keys.add(key);
    }
  }
  return [...keys]
    .map((key) => ({ key, label: getSourceLabel(key), color: getSourceColor(key) }))
    .sort((left, right) => {
      // Product source priority first (Arbeitsagentur and the other legal
      // boards before LinkedIn — consistent with the Create Loop modal and
      // Loop Details), alphabetical only as a tie-breaker for unknown sources.
      const byPriority =
        getDiscoverySourcePriority(left.key) - getDiscoverySourcePriority(right.key);
      if (byPriority !== 0) return byPriority;
      return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
    });
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

// Code-based localization (Stage 6c reason_codes/penalty_codes). Preferred over
// the English-string localizers above: it is robust to backend copy changes and
// carries the matched terms explicitly. `terms` holds the matched tokens /
// keywords for the term-bearing codes.
export function localizeEvaluationReasonCode(entry: ScoreReasonEntry): string {
  const terms = entry.terms.join(", ");
  switch (entry.code) {
    case "title_match":
      return `Должность совпадает с целью цикла: ${terms}`;
    case "keyword_matched":
      return `Совпало ключевое слово: ${terms}`;
    case "location_match":
      return "Локация совпадает с циклом";
    case "source_selected":
      return "Источник включён в цикл";
    case "no_excluded_keywords":
      return "Стоп-слов не найдено";
    default:
      return entry.code;
  }
}

export function localizeEvaluationPenaltyCode(entry: ScoreReasonEntry): string {
  const terms = entry.terms.join(", ");
  switch (entry.code) {
    case "excluded_keyword":
      return `Найдено стоп-слово: ${terms}`;
    case "source_not_selected":
      return "Источник не выбран в цикле";
    default:
      return entry.code;
  }
}

/** Localized reason lines: prefer machine-readable `reasonCodes`, fall back to
 * the legacy English `reasons` strings for older backends. */
export function localizeEvaluationReasons(evaluation: VacancyMatchEvaluation): string[] {
  if (evaluation.reasonCodes.length > 0) {
    return evaluation.reasonCodes.map(localizeEvaluationReasonCode);
  }
  return evaluation.reasons.map(localizeEvaluationReason);
}

export function localizeEvaluationPenalties(evaluation: VacancyMatchEvaluation): string[] {
  if (evaluation.penaltyCodes.length > 0) {
    return evaluation.penaltyCodes.map(localizeEvaluationPenaltyCode);
  }
  return evaluation.penalties.map(localizeEvaluationPenalty);
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
