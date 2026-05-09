import type { ReactNode } from "react";

import { Button, Card } from "src/shared/ui";

import type { RecentJobViewModel } from "./DashboardRecentJobsCard.helpers";
import type {
  DashboardRecentJobsCardViewModel,
  DashboardRecentJobsLabels,
} from "./useDashboardRecentJobsCardController";

interface RecentJobsCardShellProps {
  children: ReactNode;
  className?: string | undefined;
}

interface DashboardRecentJobsCardLayoutProps {
  className?: string | undefined;
  recentJobs: DashboardRecentJobsCardViewModel;
}

type RecentJobsHeaderProps = Pick<DashboardRecentJobsCardViewModel, "labels" | "onViewAll">;

interface RecentJobsContentProps {
  jobs: RecentJobViewModel[];
  labels: Pick<DashboardRecentJobsLabels, "empty">;
  onOpenJob: (jobId: string) => void;
}

interface RecentJobItemProps {
  job: RecentJobViewModel;
  onOpen: (jobId: string) => void;
}

interface RecentJobSummaryProps {
  company: string;
  title: string;
}

interface RecentJobMetaProps {
  createdText: string | null;
  statusClassName: string;
  statusLabel: string;
}

export function RecentJobsCardShell({ children, className }: RecentJobsCardShellProps) {
  return (
    <Card
      padding="md"
      className={["flex h-full flex-col rounded-3xl", className].filter(Boolean).join(" ")}
    >
      {children}
    </Card>
  );
}

export function DashboardRecentJobsCardLayout({
  className,
  recentJobs,
}: DashboardRecentJobsCardLayoutProps) {
  return (
    <RecentJobsCardShell className={className}>
      <RecentJobsHeader labels={recentJobs.labels} onViewAll={recentJobs.onViewAll} />
      <RecentJobsContent
        jobs={recentJobs.jobs}
        labels={recentJobs.labels}
        onOpenJob={recentJobs.onOpenJob}
      />
    </RecentJobsCardShell>
  );
}

export function RecentJobsHeader({ labels, onViewAll }: RecentJobsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-base font-semibold text-foreground">{labels.title}</div>
      <Button variant="link" className="px-0" onClick={onViewAll}>
        {labels.viewAll}
      </Button>
    </div>
  );
}

export function RecentJobsContent({ jobs, labels, onOpenJob }: RecentJobsContentProps) {
  if (jobs.length === 0) {
    return <div className="mt-3 text-sm text-muted-foreground">{labels.empty}</div>;
  }

  return (
    <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
      {jobs.map((job) => (
        <RecentJobItem key={job.id} job={job} onOpen={onOpenJob} />
      ))}
    </div>
  );
}

function RecentJobItem({ job, onOpen }: RecentJobItemProps) {
  return (
    <button
      key={job.id}
      type="button"
      onClick={() => onOpen(job.id)}
      className={[
        "w-full text-left",
        "rounded-lg border border-border bg-background p-3",
        "transition-colors",
        "hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border",
        "cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <RecentJobSummary company={job.company} title={job.title} />
        <RecentJobMeta
          createdText={job.createdText}
          statusClassName={job.statusClassName}
          statusLabel={job.statusLabel}
        />
      </div>
    </button>
  );
}

function RecentJobSummary({ company, title }: RecentJobSummaryProps) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-foreground">{title}</div>
      <div className="truncate text-xs text-muted-foreground">{company}</div>
    </div>
  );
}

function RecentJobMeta({ createdText, statusClassName, statusLabel }: RecentJobMetaProps) {
  return (
    <div className="shrink-0 text-right">
      <div
        className={[
          "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
          statusClassName,
        ].join(" ")}
      >
        {statusLabel}
      </div>

      {createdText ? <div className="mt-1 text-xs text-muted-foreground">{createdText}</div> : null}
    </div>
  );
}
