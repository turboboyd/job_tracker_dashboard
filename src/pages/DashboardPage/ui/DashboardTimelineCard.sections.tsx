import { Button, Card } from "src/shared/ui";

import type { DashboardTimelineItem } from "./DashboardTimelineCard.helpers";
import type {
  DashboardTimelineCardViewModel,
  DashboardTimelineLabels,
} from "./useDashboardTimelineCardController";

interface DashboardTimelineCardLayoutProps {
  className?: string | undefined;
  timeline: DashboardTimelineCardViewModel;
}

type DashboardTimelineHeaderProps = Pick<DashboardTimelineCardViewModel, "labels" | "onViewAll">;

interface DashboardTimelineListProps {
  labels: Pick<DashboardTimelineLabels, "empty">;
  timeline: Pick<DashboardTimelineCardViewModel, "items" | "onOpenItem">;
}

interface DashboardTimelineItemProps {
  item: DashboardTimelineItem;
  onOpenItem: (id: string) => void;
}

interface DashboardTimelineItemSummaryProps {
  company: string;
  title: string;
}

interface DashboardTimelineStatusProps {
  statusColor: string;
  statusLabel: string;
}

export function DashboardTimelineCardLayout({ className, timeline }: DashboardTimelineCardLayoutProps) {
  return (
    <Card className={["flex h-full flex-col p-6", className].filter(Boolean).join(" ")}>
      <DashboardTimelineHeader labels={timeline.labels} onViewAll={timeline.onViewAll} />
      <DashboardTimelineList labels={timeline.labels} timeline={timeline} />
    </Card>
  );
}

function DashboardTimelineHeader({ labels, onViewAll }: DashboardTimelineHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-foreground">{labels.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{labels.subtitle}</div>
      </div>

      <Button size="sm" variant="outline" shape="pill" onClick={onViewAll}>
        {labels.viewAll}
      </Button>
    </div>
  );
}

function DashboardTimelineList({
  labels,
  timeline,
}: DashboardTimelineListProps) {
  if (timeline.items.length === 0) {
    return <div className="mt-4 text-sm text-muted-foreground">{labels.empty}</div>;
  }

  return (
    <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
      {timeline.items.map((item) => (
        <DashboardTimelineListItem key={item.id} item={item} onOpenItem={timeline.onOpenItem} />
      ))}
    </div>
  );
}

function DashboardTimelineListItem({ item, onOpenItem }: DashboardTimelineItemProps) {
  return (
    <button
      type="button"
      className="w-full rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted/40"
      onClick={() => onOpenItem(item.id)}
    >
      <div className="flex items-center justify-between gap-3">
        <DashboardTimelineItemSummary company={item.company} title={item.title} />
        <DashboardTimelineStatus statusColor={item.statusColor} statusLabel={item.statusLabel} />
      </div>

      <div className="mt-2 text-xs text-muted-foreground">{item.dateLabel}</div>
    </button>
  );
}

function DashboardTimelineItemSummary({ company, title }: DashboardTimelineItemSummaryProps) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-foreground">{title}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">{company}</div>
    </div>
  );
}

function DashboardTimelineStatus({ statusColor, statusLabel }: DashboardTimelineStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor }} />
      <span className="text-xs text-muted-foreground">{statusLabel}</span>
    </div>
  );
}
