import { Button, Card } from "src/shared/ui";

import type { DashboardTopLoopRow } from "./DashboardTopLoopsCard.helpers";
import type {
  DashboardTopLoopsCardViewModel,
  DashboardTopLoopsLabels,
} from "./useDashboardTopLoopsCardController";

interface DashboardTopLoopsCardLayoutProps {
  topLoops: DashboardTopLoopsCardViewModel;
}

type DashboardTopLoopsHeaderProps = Pick<DashboardTopLoopsCardViewModel, "labels" | "onManage">;

interface DashboardTopLoopsListProps {
  labels: DashboardTopLoopsLabels;
  rows: DashboardTopLoopRow[];
}

interface DashboardTopLoopItemProps {
  labels: DashboardTopLoopsLabels;
  row: DashboardTopLoopRow;
}

interface DashboardTopLoopSummaryProps {
  name: string;
  total: number;
  totalLabel: string;
}

interface DashboardTopLoopStatsProps {
  interview: number;
  interviewLabel: string;
  offer: number;
  offerLabel: string;
}

export function DashboardTopLoopsCardLayout({ topLoops }: DashboardTopLoopsCardLayoutProps) {
  return (
    <Card className="p-6">
      <DashboardTopLoopsHeader labels={topLoops.labels} onManage={topLoops.onManage} />
      <DashboardTopLoopsList labels={topLoops.labels} rows={topLoops.rows} />
    </Card>
  );
}

function DashboardTopLoopsHeader({ labels, onManage }: DashboardTopLoopsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-foreground">{labels.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{labels.subtitle}</div>
      </div>

      <Button size="sm" variant="outline" shape="pill" onClick={onManage}>
        {labels.manage}
      </Button>
    </div>
  );
}

function DashboardTopLoopsList({ labels, rows }: DashboardTopLoopsListProps) {
  if (rows.length === 0) {
    return (
      <div className="mt-4 space-y-2">
        <div className="text-sm text-muted-foreground">{labels.empty}</div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {rows.map((row) => (
        <DashboardTopLoopItem key={row.loopId} labels={labels} row={row} />
      ))}
    </div>
  );
}

function DashboardTopLoopItem({ labels, row }: DashboardTopLoopItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
      <DashboardTopLoopSummary name={row.name} total={row.total} totalLabel={labels.total} />

      <DashboardTopLoopStats
        interview={row.interview}
        interviewLabel={labels.interview}
        offer={row.offer}
        offerLabel={labels.offer}
      />
    </div>
  );
}

function DashboardTopLoopSummary({ name, total, totalLabel }: DashboardTopLoopSummaryProps) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-foreground">{name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {totalLabel}: {total}
      </div>
    </div>
  );
}

function DashboardTopLoopStats({
  interview,
  interviewLabel,
  offer,
  offerLabel,
}: DashboardTopLoopStatsProps) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>
        {interviewLabel}: {interview}
      </span>
      <span>
        {offerLabel}: {offer}
      </span>
    </div>
  );
}
