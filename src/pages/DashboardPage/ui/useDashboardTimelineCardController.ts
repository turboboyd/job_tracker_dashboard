import type { TFunction } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/shared/config/routes";

import {
  buildDashboardTimelineItem,
  buildDashboardTimelineRows,
  type DashboardTimelineItem,
  type DashboardTimelineItemLabels,
  type DashboardTimelineMatch,
  type DashboardTimelineRow,
} from "./DashboardTimelineCard.helpers";

interface DashboardTimelineCardControllerParams {
  days: number;
  matches: DashboardTimelineMatch[];
}

export interface DashboardTimelineLabels {
  empty: string;
  subtitle: string;
  title: string;
  viewAll: string;
}

export interface DashboardTimelineCardViewModel {
  items: DashboardTimelineItem[];
  labels: DashboardTimelineLabels;
  onOpenItem: (id: string) => void;
  onViewAll: () => void;
}

export function useDashboardTimelineCardController({
  days,
  matches,
}: DashboardTimelineCardControllerParams): DashboardTimelineCardViewModel {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();
  const nowMs = useInitialTimelineNowMs();
  const rows = useDashboardTimelineRows(matches, days, nowMs);
  const labels = useMemo(() => buildDashboardTimelineLabels(t, days), [days, t]);
  const items = useMemo(
    () => buildDashboardTimelineItems(rows, i18n.language, t),
    [i18n.language, rows, t],
  );

  const onViewAll = useCallback(() => {
    void navigate(RoutePath[AppRoutes.APPLICATIONS]);
  }, [navigate]);

  const onOpenItem = useCallback(
    (id: string) => {
      void navigate(`${RoutePath[AppRoutes.APPLICATIONS]}/${id}`);
    },
    [navigate],
  );

  return {
    items,
    labels,
    onOpenItem,
    onViewAll,
  };
}

function useInitialTimelineNowMs(): number {
  const [nowMs] = useState(() => Date.now());

  return nowMs;
}

function useDashboardTimelineRows(
  matches: DashboardTimelineMatch[],
  days: number,
  nowMs: number,
): DashboardTimelineRow[] {
  return useMemo(() => buildDashboardTimelineRows(matches, days, nowMs), [days, matches, nowMs]);
}

function buildDashboardTimelineLabels(t: TFunction, days: number): DashboardTimelineLabels {
  return {
    empty: String(t("timeline.empty", { defaultValue: "No recent updates" })),
    subtitle: String(t("timeline.subtitle", { days, defaultValue: "Last {{days}} days" })),
    title: String(t("timeline.title", { defaultValue: "Timeline" })),
    viewAll: String(t("timeline.viewAll", { defaultValue: "View all" })),
  };
}

function buildDashboardTimelineItems(
  rows: DashboardTimelineRow[],
  locale: string,
  t: TFunction,
): DashboardTimelineItem[] {
  return rows.map((row) => {
    const itemLabels = buildDashboardTimelineItemLabels(row, t);

    return buildDashboardTimelineItem(row, itemLabels, locale);
  });
}

function buildDashboardTimelineItemLabels(
  row: DashboardTimelineRow,
  t: TFunction,
): DashboardTimelineItemLabels {
  return {
    companyFallback: String(t("recent.noCompany", { defaultValue: "No company" })),
    statusLabel: String(t(`status.${row.status}`, { defaultValue: row.status })),
    titleFallback: String(t("recent.untitled", { defaultValue: "Untitled" })),
  };
}
