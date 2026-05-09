import {
  getBoardColumn,
  normalizeStatusKey,
  type StatusKey,
} from "src/entities/application";
import { toMillisOptional } from "src/shared/lib";

export interface RecentJob {
  company?: string | null;
  createdAt?: unknown;
  id: string;
  status?: unknown;
  title?: string | null;
}

export type RecentJobStatus = StatusKey | "unknown";

export type DashboardTranslator = (
  key: string,
  fallback: string,
  options?: Record<string, unknown>,
) => string;

export interface RecentJobViewModel {
  company: string;
  createdText: string | null;
  id: string;
  statusClassName: string;
  statusLabel: string;
  title: string;
}

export function formatRelativeTime(
  t: DashboardTranslator,
  ms: number | undefined,
  nowMs: number,
): string | null {
  if (ms == null) return null;

  const diff = nowMs - ms;
  if (diff < 0) return t("recent.time.justNow", "just now");

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t("recent.time.justNow", "just now");

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return t("recent.time.minutesAgo", "{{count}}m ago", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("recent.time.hoursAgo", "{{count}}h ago", { count: hours });
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return t("recent.time.daysAgo", "{{count}}d ago", { count: days });
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return t("recent.time.weeksAgo", "{{count}}w ago", { count: weeks });
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return t("recent.time.monthsAgo", "{{count}}mo ago", { count: months });
  }

  const years = Math.floor(days / 365);
  return t("recent.time.yearsAgo", "{{count}}y ago", { count: years });
}

export function normalizeRecentJobStatus(value: unknown): RecentJobStatus {
  return normalizeStatusKey(value) ?? "unknown";
}

export function getStatusBadgeClass(status: RecentJobStatus): string {
  const column = status === "unknown" ? "ARCHIVED" : getBoardColumn(status);

  switch (column) {
    case "ACTIVE":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200";
    case "INTERVIEW":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200";
    case "OFFER":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "HIRED":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200";
    case "NO_RESPONSE":
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200";
    default:
      return "border-border bg-muted text-foreground";
  }
}

export function buildRecentJobViewModel(
  job: RecentJob,
  t: DashboardTranslator,
  tGlobal: DashboardTranslator,
  nowMs: number,
): RecentJobViewModel {
  const status = normalizeRecentJobStatus(job.status);
  const relativeCreated = formatRelativeTime(t, toMillisOptional(job.createdAt), nowMs);

  return {
    company: getTextOrFallback(job.company, t("recent.company", "Company")),
    createdText: relativeCreated ? `${t("recent.created", "Created")} ${relativeCreated}` : null,
    id: job.id,
    statusClassName: getStatusBadgeClass(status),
    statusLabel: getStatusLabel(status, t, tGlobal),
    title: getTextOrFallback(job.title, t("recent.untitled", "Untitled role")),
  };
}

function getStatusLabel(
  status: RecentJobStatus,
  t: DashboardTranslator,
  tGlobal: DashboardTranslator,
): string {
  if (status === "unknown") return t("status.unknown", "Unknown");

  return tGlobal(`status.${status}`, humanizeStatusKey(status));
}

function humanizeStatusKey(status: StatusKey): string {
  return status
    .split("_")
    .map((part) => (part ? part.charAt(0) + part.slice(1).toLowerCase() : part))
    .join(" ");
}

function getTextOrFallback(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
