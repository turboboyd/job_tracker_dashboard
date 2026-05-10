import type { BoardColumnKey } from "src/entities/application";

import type { IconName } from "../DashboardIcon";

export interface DashboardStatsSummary {
  byColumn: Record<BoardColumnKey, number>;
  total: number;
}

export type DashboardStatsStatus = BoardColumnKey;

export interface DashboardStatColumn {
  column: BoardColumnKey;
  iconName: IconName;
  label: string;
}

interface DashboardStatColumnConfig {
  column: BoardColumnKey;
  fallback: string;
  iconName: IconName;
  labelKey: string;
}

type DashboardStatsTranslator = (key: string, fallback: string) => string;

const DASHBOARD_STAT_COLUMN_CONFIG = [
  {
    column: "ACTIVE",
    fallback: "Active",
    iconName: "applied",
    labelKey: "board.column.ACTIVE",
  },
  {
    column: "INTERVIEW",
    fallback: "Interview",
    iconName: "interview",
    labelKey: "board.column.INTERVIEW",
  },
  {
    column: "OFFER",
    fallback: "Offer",
    iconName: "offer",
    labelKey: "board.column.OFFER",
  },
  {
    column: "HIRED",
    fallback: "Hired",
    iconName: "hired",
    labelKey: "board.column.HIRED",
  },
  {
    column: "REJECTED",
    fallback: "Rejected",
    iconName: "rejected",
    labelKey: "board.column.REJECTED",
  },
  {
    column: "NO_RESPONSE",
    fallback: "No response",
    iconName: "no_response",
    labelKey: "board.column.NO_RESPONSE",
  },
] satisfies readonly DashboardStatColumnConfig[];

export function buildDashboardStatColumns(t: DashboardStatsTranslator): DashboardStatColumn[] {
  return DASHBOARD_STAT_COLUMN_CONFIG.map(({ column, fallback, iconName, labelKey }) => ({
    column,
    iconName,
    label: t(labelKey, fallback),
  }));
}
