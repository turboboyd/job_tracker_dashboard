import { AlertCircle, CalendarClock, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { StatusLabel } from "src/entities/application";
import { Card } from "src/shared/ui/Card";
import { InlineError } from "src/shared/ui/InlineError";

import type {
  DashboardPlanBucket,
  DashboardPlanItem,
} from "../model/dashboardAggregations";

type DashboardPlanFilter = DashboardPlanBucket | "all";

type DashboardPlanCounts = Record<DashboardPlanFilter, number>;

const PLAN_FILTERS: DashboardPlanFilter[] = [
  "today",
  "overdue",
  "tomorrow",
  "all",
];

interface DashboardPlanCardProps {
  error: string | null;
  isLoading: boolean;
  items: DashboardPlanItem[];
  onOpenApplication: (appId: string) => void;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;

  const maybe = value as { toDate?: unknown };
  const date =
    typeof maybe.toDate === "function"
      ? (maybe.toDate as () => Date)()
      : new Date(value as never);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getTextOrFallback(value: string | null, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  return trimmed;
}

function getTimeBadgeClassName(item: DashboardPlanItem): string {
  if (item.isOverdue) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200";
  }

  if (item.isToday) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200";
  }

  if (item.isTomorrow) {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200";
  }

  return "border-border bg-muted text-muted-foreground";
}

function buildPlanCounts(items: DashboardPlanItem[]): DashboardPlanCounts {
  return items.reduce<DashboardPlanCounts>(
    (counts, item) => ({
      ...counts,
      [item.bucket]: counts[item.bucket] + 1,
    }),
    {
      all: items.length,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      upcoming: 0,
    },
  );
}

function filterPlanItems(
  items: DashboardPlanItem[],
  filter: DashboardPlanFilter,
): DashboardPlanItem[] {
  if (filter === "all") return items;

  return items.filter((item) => item.bucket === filter);
}

function PlanFilterButton({
  count,
  filter,
  isActive,
  onSelect,
}: {
  count: number;
  filter: DashboardPlanFilter;
  isActive: boolean;
  onSelect: (filter: DashboardPlanFilter) => void;
}) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  return (
    <button
      type="button"
      onClick={() => onSelect(filter)}
      className={[
        "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      <span>{t(`plan.filter.${filter}`)}</span>
      <span
        className={[
          "rounded-full px-1.5 py-0.5 text-[11px]",
          isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function PlanFilterBar({
  counts,
  selectedFilter,
  onSelectFilter,
}: {
  counts: DashboardPlanCounts;
  selectedFilter: DashboardPlanFilter;
  onSelectFilter: (filter: DashboardPlanFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {PLAN_FILTERS.map((filter) => (
        <PlanFilterButton
          key={filter}
          count={counts[filter]}
          filter={filter}
          isActive={selectedFilter === filter}
          onSelect={onSelectFilter}
        />
      ))}
    </div>
  );
}

function PlanItemTime({
  item,
  language,
}: {
  item: DashboardPlanItem;
  language: string;
}) {
  const date = toDate(item.nextActionAt);

  if (!date) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
      <span
        className={[
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
          getTimeBadgeClassName(item),
        ].join(" ")}
      >
        {item.isOverdue ? <AlertCircle className="h-3 w-3" aria-hidden="true" /> : null}
        {new Intl.DateTimeFormat(language, {
          hour: "2-digit",
          minute: "2-digit",
        }).format(date)}
      </span>
      <span className="text-xs text-muted-foreground">
        {new Intl.DateTimeFormat(language, {
          day: "2-digit",
          month: "short",
        }).format(date)}
      </span>
    </div>
  );
}

function PlanItemRow({
  item,
  onOpenApplication,
}: {
  item: DashboardPlanItem;
  onOpenApplication: (appId: string) => void;
}) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });

  return (
    <button
      type="button"
      onClick={() => onOpenApplication(item.id)}
      className={[
        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background p-3 text-left",
        "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {getTextOrFallback(item.title, t("recent.untitled"))}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            <StatusLabel status={item.status} />
          </span>
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {getTextOrFallback(item.company, t("recent.noCompany"))}
        </div>
        {item.nextActionText ? (
          <div className="mt-1 truncate text-sm text-foreground">
            {item.nextActionText}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <PlanItemTime item={item} language={i18n.resolvedLanguage ?? i18n.language} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
    </button>
  );
}

export function DashboardPlanCard({
  error,
  isLoading,
  items,
  onOpenApplication,
}: DashboardPlanCardProps) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const [selectedFilter, setSelectedFilter] = useState<DashboardPlanFilter>("today");
  const counts = useMemo(() => buildPlanCounts(items), [items]);
  const visibleItems = useMemo(
    () => filterPlanItems(items, selectedFilter),
    [items, selectedFilter],
  );
  const emptyText =
    items.length === 0 ? t("plan.empty") : t("plan.emptyFilter");

  return (
    <Card padding="md" shadow="sm" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{t("plan.title")}</span>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {t("plan.count", { count: items.length })}
        </span>
      </div>

      <PlanFilterBar
        counts={counts}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
      ) : null}
      {error ? <InlineError message={error} /> : null}

      {!isLoading && !error && visibleItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {visibleItems.map((item) => (
            <PlanItemRow
              key={item.id}
              item={item}
              onOpenApplication={onOpenApplication}
            />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
