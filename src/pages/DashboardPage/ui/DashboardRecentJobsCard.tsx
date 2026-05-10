import type { RecentJob } from "./DashboardRecentJobsCard.helpers";
import {
  DashboardRecentJobsCardLayout,
} from "./DashboardRecentJobsCard.sections";
import { useDashboardRecentJobsCardController } from "./useDashboardRecentJobsCardController";

interface DashboardRecentJobsCardProps {
  className?: string;
  jobs: RecentJob[];
  onOpenJob?: (jobId: string) => void;
  onViewAll: () => void;
}

export function DashboardRecentJobsCard({
  className,
  jobs,
  onOpenJob,
  onViewAll,
}: DashboardRecentJobsCardProps) {
  const recentJobs = useDashboardRecentJobsCardController({ jobs, onOpenJob, onViewAll });

  return <DashboardRecentJobsCardLayout className={className} recentJobs={recentJobs} />;
}

export type { RecentJob };
