import type { TFunction } from "i18next";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

import { StatusLabel } from "src/entities/application";
import { Button } from "src/shared/ui";
import { Card } from "src/shared/ui/Card";

import {
  getPlanItemDate,
  type DashboardCalendarDay,
} from "./DashboardCalendarPage.helpers";
import type { DashboardPlanItem } from "./model/dashboardAggregations";

type DashboardT = TFunction<"dashboard">;

interface CalendarWeekCardProps {
  days: DashboardCalendarDay[];
  language: string;
  onNextWeek: () => void;
  onPreviousWeek: () => void;
  onSelectDate: (date: Date) => void;
  onToday: () => void;
  t: DashboardT;
}

interface CalendarAgendaCardProps {
  date: Date;
  items: DashboardPlanItem[];
  language: string;
  onExportDay: () => void;
  onOpenApplication: (appId: string) => void;
  t: DashboardT;
}

interface CalendarOverdueCardProps {
  items: DashboardPlanItem[];
  language: string;
  onOpenApplication: (appId: string) => void;
  t: DashboardT;
}

interface CalendarSummaryProps {
  overdueCount: number;
  selectedDayCount: number;
  t: DashboardT;
  weekCount: number;
}

function formatDayName(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { weekday: "short" }).format(date);
}

function formatDayMonth(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatFullDate(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "long",
    weekday: "long",
  }).format(date);
}

function formatTime(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTextOrFallback(value: string | null, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  return trimmed;
}

function CalendarDayButton({
  day,
  language,
  onSelectDate,
  todayLabel,
}: {
  day: DashboardCalendarDay;
  language: string;
  onSelectDate: (date: Date) => void;
  todayLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectDate(day.date)}
      className={[
        "min-h-24 rounded-lg border p-3 text-left transition-colors",
        day.isSelected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background hover:bg-muted",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase text-muted-foreground">
            {formatDayName(day.date, language)}
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {formatDayMonth(day.date, language)}
          </div>
        </div>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-xs font-medium",
            day.count > 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {day.count}
        </span>
      </div>
      {day.isToday ? (
        <div className="mt-4 text-xs font-medium text-primary">{todayLabel}</div>
      ) : null}
    </button>
  );
}

export function CalendarWeekCard({
  days,
  language,
  onNextWeek,
  onPreviousWeek,
  onSelectDate,
  onToday,
  t,
}: CalendarWeekCardProps) {
  return (
    <Card padding="md" shadow="sm" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{t("calendar.week")}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button size="sm" variant="outline" shape="pill" onClick={onToday}>
            {t("calendar.today")}
          </Button>
          <Button size="icon" variant="outline" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => (
          <CalendarDayButton
            key={day.dateKey}
            day={day}
            language={language}
            onSelectDate={onSelectDate}
            todayLabel={t("calendar.today")}
          />
        ))}
      </div>
    </Card>
  );
}

function CalendarAgendaItem({
  item,
  language,
  onOpenApplication,
  t,
}: {
  item: DashboardPlanItem;
  language: string;
  onOpenApplication: (appId: string) => void;
  t: DashboardT;
}) {
  const date = getPlanItemDate(item);

  return (
    <button
      type="button"
      onClick={() => onOpenApplication(item.id)}
      className={[
        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background p-3 text-left",
        "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {item.isOverdue ? (
          <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
        ) : (
          <Clock3 className="h-4 w-4" aria-hidden="true" />
        )}
      </div>

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

      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-foreground">
          {date ? formatTime(date, language) : t("common.noValue")}
        </div>
        <div className="text-xs text-muted-foreground">
          {date ? formatDayMonth(date, language) : null}
        </div>
      </div>
    </button>
  );
}

export function CalendarAgendaCard({
  date,
  items,
  language,
  onExportDay,
  onOpenApplication,
  t,
}: CalendarAgendaCardProps) {
  return (
    <Card padding="md" shadow="sm" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold text-foreground">
            {t("calendar.dayAgenda")}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatFullDate(date, language)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
          <Button
            size="sm"
            variant="outline"
            shape="pill"
            className="gap-2"
            disabled={items.length === 0}
            onClick={onExportDay}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            {t("calendar.exportDay")}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {t("calendar.emptyDay")}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <CalendarAgendaItem
              key={item.id}
              item={item}
              language={language}
              onOpenApplication={onOpenApplication}
              t={t}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export function CalendarOverdueCard({
  items,
  language,
  onOpenApplication,
  t,
}: CalendarOverdueCardProps) {
  return (
    <Card padding="md" shadow="sm" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
          <span>{t("calendar.overdue")}</span>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {t("calendar.emptyOverdue")}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <CalendarAgendaItem
              key={item.id}
              item={item}
              language={language}
              onOpenApplication={onOpenApplication}
              t={t}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card padding="md" shadow="sm" className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </Card>
  );
}

export function CalendarSummary({
  overdueCount,
  selectedDayCount,
  t,
  weekCount,
}: CalendarSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SummaryCard label={t("calendar.summary.day")} value={selectedDayCount} />
      <SummaryCard label={t("calendar.summary.week")} value={weekCount} />
      <SummaryCard label={t("calendar.summary.overdue")} value={overdueCount} />
    </div>
  );
}
