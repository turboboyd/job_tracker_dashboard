import type { TFunction } from "i18next";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/shared/config/routes";

import {
  buildDashboardTopLoopRows,
  type DashboardTopLoop,
  type DashboardTopLoopMatch,
  type DashboardTopLoopRow,
} from "./DashboardTopLoopsCard.helpers";

interface DashboardTopLoopsCardControllerParams {
  loops: DashboardTopLoop[];
  matches: DashboardTopLoopMatch[];
}

export interface DashboardTopLoopsLabels {
  empty: string;
  interview: string;
  manage: string;
  offer: string;
  subtitle: string;
  title: string;
  total: string;
}

export interface DashboardTopLoopsCardViewModel {
  labels: DashboardTopLoopsLabels;
  onManage: () => void;
  rows: DashboardTopLoopRow[];
}

export function useDashboardTopLoopsCardController({
  loops,
  matches,
}: DashboardTopLoopsCardControllerParams): DashboardTopLoopsCardViewModel {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();
  const rows = useMemo(() => buildDashboardTopLoopRows(loops, matches), [loops, matches]);
  const labels = useMemo(() => buildDashboardTopLoopsLabels(t), [t]);

  const openLoops = useCallback(() => {
    void navigate(RoutePath[AppRoutes.LOOPS]);
  }, [navigate]);

  return {
    labels,
    onManage: openLoops,
    rows,
  };
}

function buildDashboardTopLoopsLabels(t: TFunction): DashboardTopLoopsLabels {
  return {
    empty: String(t("topLoops.empty", { defaultValue: "No data yet" })),
    interview: String(t("board.column.INTERVIEW", { defaultValue: "Interview" })),
    manage: String(t("topLoops.manage", { defaultValue: "Manage" })),
    offer: String(t("board.column.OFFER", { defaultValue: "Offer" })),
    subtitle: String(t("topLoops.subtitle", { defaultValue: "Where you get interviews" })),
    title: String(t("topLoops.title", { defaultValue: "Top loops" })),
    total: String(t("topLoops.total", { defaultValue: "In pipeline" })),
  };
}
