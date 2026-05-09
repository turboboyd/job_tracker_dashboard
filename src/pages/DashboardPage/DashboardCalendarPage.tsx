import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/shared/config/routes";
import { buildIcsCalendar, downloadIcsFile } from "src/shared/lib/calendar";
import { Button } from "src/shared/ui";
import { InlineError } from "src/shared/ui/InlineError";

import {
  addCalendarDays,
  buildCalendarWeekDays,
  countCalendarItemsInWeek,
  filterCalendarItemsByDate,
  filterOverdueCalendarItems,
  getLocalDateKey,
  getPlanItemDate,
} from "./DashboardCalendarPage.helpers";
import {
  CalendarAgendaCard,
  CalendarOverdueCard,
  CalendarSummary,
  CalendarWeekCard,
} from "./DashboardCalendarPage.sections";
import type { DashboardPlanItem } from "./model/dashboardAggregations";
import { useDashboardData } from "./model/useDashboardData";
import {
  DashboardLoopsFilterModal,
  DashboardTabsNav,
} from "./ui";

function DashboardCalendarHeader({
  onOpenLoopsFilter,
  title,
  loopsButton,
}: {
  loopsButton: string;
  onOpenLoopsFilter: () => void;
  title: string;
}) {
  return (
    <div className="shrink-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-3 px-1 pb-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-foreground">{title}</div>

          <Button
            size="sm"
            variant="outline"
            shape="pill"
            className="gap-2"
            onClick={onOpenLoopsFilter}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {loopsButton}
          </Button>
        </div>

        <DashboardTabsNav />
      </div>
    </div>
  );
}

function getDashboardTextOrFallback(value: string | null, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  return trimmed;
}

function buildPlanItemApplicationUrl(item: DashboardPlanItem): string {
  return `${window.location.origin}${RoutePath[AppRoutes.APPLICATIONS]}/${item.id}`;
}

export default function DashboardCalendarPage() {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const dashboard = useDashboardData();
  const language = i18n.resolvedLanguage ?? i18n.language;

  const weekDays = useMemo(
    () => buildCalendarWeekDays(dashboard.planItems, selectedDate),
    [dashboard.planItems, selectedDate],
  );
  const selectedDayItems = useMemo(
    () => filterCalendarItemsByDate(dashboard.planItems, selectedDate),
    [dashboard.planItems, selectedDate],
  );
  const overdueItems = useMemo(
    () => filterOverdueCalendarItems(dashboard.planItems),
    [dashboard.planItems],
  );
  const weekCount = useMemo(
    () => countCalendarItemsInWeek(dashboard.planItems, selectedDate),
    [dashboard.planItems, selectedDate],
  );

  const openApplication = (appId: string) => {
    void navigate(`${RoutePath[AppRoutes.APPLICATIONS]}/${appId}`);
  };

  const exportSelectedDay = () => {
    const events = selectedDayItems.flatMap((item) => {
      const startsAt = getPlanItemDate(item);
      if (!startsAt) return [];

      const roleTitle = getDashboardTextOrFallback(item.title, t("recent.untitled"));
      const companyName = getDashboardTextOrFallback(item.company, t("recent.noCompany"));
      const appUrl = buildPlanItemApplicationUrl(item);
      const description = [
        item.nextActionText?.trim()
          ? `${t("calendar.reason")}: ${item.nextActionText.trim()}`
          : "",
        `${t("calendar.applicationLink")}: ${appUrl}`,
      ]
        .filter(Boolean)
        .join("\n");

      return [
        {
          description,
          startsAt,
          title: `${roleTitle} / ${companyName}`,
          uid: `${item.id}-${startsAt.getTime()}@job-tracker-dashboard`,
          url: appUrl,
        },
      ];
    });

    if (events.length === 0) return;

    const dateKey = getLocalDateKey(selectedDate);
    const contents = buildIcsCalendar({
      title: `${t("calendar.dayAgenda")} ${dateKey}`,
      events,
    });

    downloadIcsFile(`application-plan-${dateKey}.ics`, contents);
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardCalendarHeader
        title={t("tabs.calendar")}
        loopsButton={t("loopsFilter.button")}
        onOpenLoopsFilter={() => setLoopsModalOpen(true)}
      />

      <DashboardLoopsFilterModal
        open={loopsModalOpen}
        onOpenChange={setLoopsModalOpen}
        value={dashboard.loopsFilter}
        loops={dashboard.loops}
        onChange={dashboard.setLoopsFilter}
      />

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="space-y-6 p-6">
          {dashboard.error ? <InlineError message={dashboard.error} /> : null}

          <CalendarSummary
            overdueCount={overdueItems.length}
            selectedDayCount={selectedDayItems.length}
            t={t}
            weekCount={weekCount}
          />

          <CalendarWeekCard
            days={weekDays}
            language={language}
            onNextWeek={() => setSelectedDate((date) => addCalendarDays(date, 7))}
            onPreviousWeek={() => setSelectedDate((date) => addCalendarDays(date, -7))}
            onSelectDate={setSelectedDate}
            onToday={() => setSelectedDate(new Date())}
            t={t}
          />

          {dashboard.isLoading ? (
            <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
            <CalendarAgendaCard
              date={selectedDate}
              items={selectedDayItems}
              language={language}
              onExportDay={exportSelectedDay}
              onOpenApplication={openApplication}
              t={t}
            />
            <CalendarOverdueCard
              items={overdueItems}
              language={language}
              onOpenApplication={openApplication}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
