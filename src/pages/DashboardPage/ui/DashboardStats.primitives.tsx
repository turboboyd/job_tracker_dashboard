import type { ReactNode } from "react";

import {
  BOARD_COLUMN_COLOR,
  STATUS_COLOR_DOT_CLASS,
  type BoardColumnKey,
} from "src/entities/application";
import { Card, CardButton, KpiCard } from "src/shared/ui";

import { DashboardIcon } from "../DashboardIcon";

import type {
  DashboardStatColumn,
  DashboardStatsStatus,
} from "./DashboardStats.helpers";

interface DashboardStatsCardShellProps {
  children: ReactNode;
}

interface DashboardStatsHeaderProps {
  subtitle?: string | undefined;
  title: string;
}

interface MiniStatProps {
  label: string;
  value: number;
}

interface DashboardStatsGridItemProps {
  column: DashboardStatColumn;
  onGoJobs?: ((status?: DashboardStatsStatus) => void) | undefined;
  value: number;
}

interface StatusTitleProps {
  column: BoardColumnKey;
  label: string;
}

export function DashboardStatsCardShell({ children }: DashboardStatsCardShellProps) {
  return (
    <Card padding="md" className="rounded-3xl">
      {children}
    </Card>
  );
}

export function DashboardStatsHeader({ subtitle, title }: DashboardStatsHeaderProps) {
  return (
    <div className="min-w-0">
      <div className="text-base font-semibold text-foreground">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div> : null}
    </div>
  );
}

export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function DashboardStatsGridItem({
  column,
  onGoJobs,
  value,
}: DashboardStatsGridItemProps) {
  return (
    <CardButton onClick={() => onGoJobs?.(column.column)}>
      <KpiCard
        title={<StatusTitle column={column.column} label={column.label} />}
        value={value}
        icon={<DashboardIcon name={column.iconName} />}
      />
    </CardButton>
  );
}

function StatusTitle({ column, label }: StatusTitleProps) {
  const color = BOARD_COLUMN_COLOR[column];

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className={"h-2 w-2 shrink-0 rounded-full " + STATUS_COLOR_DOT_CLASS[color]} />
      <span className="truncate whitespace-nowrap">{label}</span>
    </span>
  );
}
