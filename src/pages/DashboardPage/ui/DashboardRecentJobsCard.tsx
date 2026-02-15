import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui";
import { Card } from "src/shared/ui/Card/Card";

export type RecentJob = {
  id: string;
  title?: string | null;
  company?: string | null;
  status?: unknown;
  createdAt?: unknown;
};

type Props = {
  jobs: RecentJob[];
  onViewAll: () => void;
  onOpenJob?: (jobId: string) => void;
  className?: string;
};

function toMillis(value: unknown): number | null {
  if (!value) return null;

  if (typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (typeof value === "number") return value;

  const seconds = (value as { seconds?: unknown }).seconds;
  if (typeof seconds === "number") return seconds * 1000;

  return null;
}

type Translator = (
  key: string,
  fallback: string,
  options?: Record<string, unknown>,
) => string;

function formatRelative(
  t: Translator,
  ms: number | null,
  nowMs: number,
): string | null {
  if (!ms) return null;

  const diff = nowMs - ms;
  if (diff < 0) return t("recent.time.justNow", "just now");

  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t("recent.time.justNow", "just now");

  const min = Math.floor(sec / 60);
  if (min < 60)
    return t("recent.time.minutesAgo", "{{count}}m ago", {
      count: min,
    });

  const hr = Math.floor(min / 60);
  if (hr < 24)
    return t("recent.time.hoursAgo", "{{count}}h ago", {
      count: hr,
    });

  const days = Math.floor(hr / 24);
  if (days < 7)
    return t("recent.time.daysAgo", "{{count}}d ago", {
      count: days,
    });

  const weeks = Math.floor(days / 7);
  if (weeks < 5)
    return t("recent.time.weeksAgo", "{{count}}w ago", {
      count: weeks,
    });

  const months = Math.floor(days / 30);
  if (months < 12)
    return t("recent.time.monthsAgo", "{{count}}mo ago", {
      count: months,
    });

  const years = Math.floor(days / 365);
  return t("recent.time.yearsAgo", "{{count}}y ago", {
    count: years,
  });
}

function normalizeStatus(
  value: unknown,
):
  | "new"
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "unknown" {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "new") return "new";
  if (raw === "saved") return "saved";
  if (raw === "applied") return "applied";
  if (raw === "interview") return "interview";
  if (raw === "offer") return "offer";
  if (raw === "rejected") return "rejected";
  return "unknown";
}

function statusBadgeClass(st: ReturnType<typeof normalizeStatus>): string {
  switch (st) {
    case "new":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200";
    case "saved":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200";
    case "applied":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200";
    case "interview":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200";
    case "offer":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200";
    default:
      return "border-border bg-muted text-foreground";
  }
}

export function DashboardRecentJobsCard({
  jobs,
  onViewAll,
  onOpenJob,
  className,
}: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const [nowMs] = useState<number>(() => Date.now());

  const tr: Translator = (key, fallback, options) =>
    String(t(key, { defaultValue: fallback, ...(options ?? {}) }));

  return (
    <Card
      padding="md"
      className={["flex h-full flex-col rounded-3xl", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-foreground">
          {tr("recent.title", "Recent applications")}
        </div>
        <Button variant="link" className="px-0" onClick={onViewAll}>
          {tr("recent.viewAll", "View all")}
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground">
          {tr(
            "recent.empty",
            "No applications yet. Add your first one to see activity here.",
          )}
        </div>
      ) : (
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {jobs.map((j) => {
            const rel = formatRelative(tr, toMillis(j.createdAt), nowMs);
            const normalized = normalizeStatus(j.status);
            const statusLabel =
              normalized === "unknown"
                ? tr("status.unknown", "Unknown")
                : tr(`status.${normalized}`, normalized);

            return (
              <button
                key={j.id}
                type="button"
                onClick={() => (onOpenJob ? onOpenJob(j.id) : onViewAll())}
                className={[
                  "w-full text-left",
                  "rounded-lg border border-border bg-background p-3",
                  "transition-colors",
                  "hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border",
                  "cursor-pointer",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {j.title || tr("recent.untitled", "Untitled role")}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {j.company || tr("recent.company", "Company")}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div
                      className={[
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                        statusBadgeClass(normalized),
                      ].join(" ")}
                    >
                      {statusLabel}
                    </div>

                    {rel && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {tr("recent.created", "Created")}&nbsp;{rel}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
