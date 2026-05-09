import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  Users,
  Zap,
  PhoneCall,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";

import type { InteractionDoc } from "src/entities/contact";
import { classNames } from "src/shared/lib";
import { Card } from "src/shared/ui/Card";
import { InlineError } from "src/shared/ui/InlineError";

import type { FollowUpFilter, FollowUpItem } from "./useDashboardFollowUpsController";
import { useDashboardFollowUpsController } from "./useDashboardFollowUpsController";

// ─── Icons ────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<InteractionDoc["type"], ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MESSAGE: MessageSquare,
  MEETING: Users,
  OTHER: Zap,
};

function getFilterCountClass(isActive: boolean, isOverdueAlert: boolean): string {
  if (isOverdueAlert) {
    return "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300";
  }
  if (isActive) {
    return "bg-primary-foreground/20";
  }
  return "bg-muted text-muted-foreground";
}

const TYPE_COLOR: Record<InteractionDoc["type"], string> = {
  CALL: "text-blue-500",
  EMAIL: "text-violet-500",
  MESSAGE: "text-emerald-500",
  MEETING: "text-amber-500",
  OTHER: "text-muted-foreground",
};

// ─── Filter bar ───────────────────────────────────────────────────────────────

const FILTERS: FollowUpFilter[] = ["overdue", "today", "tomorrow", "all"];

const FILTER_LABEL: Record<FollowUpFilter, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  all: "All",
};

function FilterButton({
  filter,
  count,
  isActive,
  onSelect,
}: {
  filter: FollowUpFilter;
  count: number;
  isActive: boolean;
  onSelect: (f: FollowUpFilter) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(filter)}
      className={classNames(
        "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3",
        "text-xs font-medium transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span>{FILTER_LABEL[filter]}</span>
      <span
        className={classNames(
          "rounded-full px-1.5 py-0.5 text-[11px]",
          getFilterCountClass(
            isActive,
            filter === "overdue" && count > 0 && !isActive,
          ),
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Time badge ───────────────────────────────────────────────────────────────

function getTimeBadgeColor(item: FollowUpItem): string {
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

function TimeBadge({ item }: { item: FollowUpItem }) {
  const d = new Date(item.nextStepAtMs);
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });

  const colorClass = getTimeBadgeColor(item);

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
      <span
        className={classNames(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
          colorClass,
        )}
      >
        {item.isOverdue ? (
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
        ) : null}
        {timeStr}
      </span>
      <span className="text-[11px] text-muted-foreground">{dateStr}</span>
    </div>
  );
}

// ─── Single row ───────────────────────────────────────────────────────────────

function FollowUpRow({
  item,
  onDone,
}: {
  item: FollowUpItem;
  onDone: (id: string) => void;
}) {
  const Icon = TYPE_ICON[item.type];

  return (
    <div
      className={classNames(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3",
        "rounded-lg border border-border bg-background p-3",
        "transition-colors hover:bg-muted/40",
      )}
    >
      {/* Type icon */}
      <div
        className={classNames(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          "bg-muted/60",
        )}
      >
        <Icon
          className={classNames("h-4 w-4", TYPE_COLOR[item.type])}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="min-w-0">
        {item.contactDisplayName ? (
          <p className="truncate text-sm font-semibold text-foreground">
            {item.contactDisplayName}
          </p>
        ) : null}
        {item.applicationDisplayTitle ? (
          <p className="truncate text-xs text-muted-foreground">
            {item.applicationDisplayTitle}
          </p>
        ) : null}
        {item.nextStepText ? (
          <p className="mt-0.5 truncate text-sm text-foreground">
            {item.nextStepText}
          </p>
        ) : null}
      </div>

      {/* Right side: time + done button */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <TimeBadge item={item} />
        <button
          type="button"
          onClick={() => onDone(item.interactionId)}
          title="Mark as done"
          className={classNames(
            "flex items-center gap-1 rounded px-1.5 py-0.5",
            "text-[11px] text-muted-foreground",
            "opacity-0 transition-opacity group-hover:opacity-100",
            "hover:bg-emerald-50 hover:text-emerald-600",
            "dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400",
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function DashboardFollowUpsCard() {
  const {
    visibleItems,
    counts,
    filter,
    setFilter,
    isLoading,
    error,
    handleClearNextStep,
  } = useDashboardFollowUpsController();

  const hasOverdue = counts.overdue > 0;
  let content: ReactNode;

  if (isLoading) {
    content = (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </div>
    );
  } else if (error) {
    content = <InlineError message={error} />;
  } else if (visibleItems.length === 0) {
    const emptyMessage =
      counts.all === 0
        ? "No follow-ups scheduled. Log a call to add one."
        : "No follow-ups in this view.";
    content = (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {visibleItems.map((item) => (
          <FollowUpRow
            key={item.interactionId}
            item={item}
            onDone={handleClearNextStep}
          />
        ))}
      </div>
    );
  }

  return (
    <Card padding="md" shadow="sm" className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <PhoneCall
            className={classNames(
              "h-4 w-4",
              hasOverdue ? "text-red-500" : "text-primary",
            )}
            aria-hidden="true"
          />
          <span>Follow-ups</span>
          {hasOverdue ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {counts.overdue} overdue
            </span>
          ) : null}
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {counts.all} total
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <FilterButton
            key={f}
            filter={f}
            count={counts[f]}
            isActive={filter === f}
            onSelect={setFilter}
          />
        ))}
      </div>

      {/* States */}
      {content}
    </Card>
  );
}
