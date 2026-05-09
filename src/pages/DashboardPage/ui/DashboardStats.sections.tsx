import { Button } from "src/shared/ui";

import type {
  DashboardStatColumn,
  DashboardStatsStatus,
  DashboardStatsSummary,
} from "./DashboardStats.helpers";
import {
  DashboardStatsCardShell,
  DashboardStatsHeader,
  DashboardStatsGridItem,
  MiniStat,
} from "./DashboardStats.primitives";

interface DashboardStatsLoadingCardProps {
  message: string;
}

interface DashboardStatsErrorCardProps {
  error: string;
  title: string;
}

interface DashboardStatsEmptyCardProps {
  columns: DashboardStatColumn[];
  ctaLabel: string;
  onAddFirstJob?: (() => void) | undefined;
  subtitle: string;
  title: string;
}

interface DashboardStatsGridProps {
  columns: DashboardStatColumn[];
  onGoJobs?: ((status?: DashboardStatsStatus) => void) | undefined;
  summary: DashboardStatsSummary;
  title: string;
}

export function DashboardStatsLoadingCard({ message }: DashboardStatsLoadingCardProps) {
  return (
    <DashboardStatsCardShell>
      <div className="text-sm text-muted-foreground">{message}</div>
    </DashboardStatsCardShell>
  );
}

export function DashboardStatsErrorCard({ error, title }: DashboardStatsErrorCardProps) {
  return (
    <DashboardStatsCardShell>
      <DashboardStatsHeader title={title} subtitle={error} />
    </DashboardStatsCardShell>
  );
}

export function DashboardStatsEmptyCard({
  columns,
  ctaLabel,
  onAddFirstJob,
  subtitle,
  title,
}: DashboardStatsEmptyCardProps) {
  return (
    <DashboardStatsCardShell>
      <div className="flex items-start justify-between gap-4">
        <DashboardStatsHeader title={title} subtitle={subtitle} />

        <Button variant="outline" shadow="sm" onClick={onAddFirstJob}>
          {ctaLabel}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {columns.map((column) => (
          <MiniStat key={column.column} label={column.label} value={0} />
        ))}
      </div>
    </DashboardStatsCardShell>
  );
}

export function DashboardStatsGrid({
  columns,
  onGoJobs,
  summary,
  title,
}: DashboardStatsGridProps) {
  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold text-foreground">{title}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {columns.map((column) => (
          <DashboardStatsGridItem
            key={column.column}
            column={column}
            onGoJobs={onGoJobs}
            value={summary.byColumn[column.column]}
          />
        ))}
      </div>
    </div>
  );
}
