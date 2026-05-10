import type {
  DashboardStatColumn,
  DashboardStatsStatus,
  DashboardStatsSummary,
} from "./DashboardStats.helpers";

export interface DashboardStatsProps {
  error?: string | null;
  isLoading: boolean;
  onAddFirstJob?: (() => void) | undefined;
  onGoJobs?: ((status?: DashboardStatsStatus) => void) | undefined;
  summary: DashboardStatsSummary;
}

interface DashboardStatsLabels {
  emptyCta: string;
  emptySubtitle: string;
  emptyTitle: string;
  errorTitle: string;
  loading: string;
  title: string;
}

export type DashboardStatsViewModel =
  | {
      kind: "loading";
      message: string;
    }
  | {
      error: string;
      kind: "error";
      title: string;
    }
  | {
      columns: DashboardStatColumn[];
      ctaLabel: string;
      kind: "empty";
      onAddFirstJob?: (() => void) | undefined;
      subtitle: string;
      title: string;
    }
  | {
      columns: DashboardStatColumn[];
      kind: "grid";
      onGoJobs?: ((status?: DashboardStatsStatus) => void) | undefined;
      summary: DashboardStatsSummary;
      title: string;
    };

export function buildDashboardStatsLabels(
  tr: (key: string, fallback: string) => string,
): DashboardStatsLabels {
  return {
    emptyCta: tr("stats.empty.cta", "Add job"),
    emptySubtitle: tr(
      "stats.empty.subtitle",
      "Start tracking your applications - your statistics will appear here.",
    ),
    emptyTitle: tr("stats.empty.title", "Add your first job"),
    errorTitle: tr("stats.error.title", "Couldn't load jobs"),
    loading: tr("common.loading", "Loading..."),
    title: tr("stats.title", "Statistics"),
  };
}

export function buildDashboardStatsViewModel({
  columns,
  error,
  isLoading,
  labels,
  onAddFirstJob,
  onGoJobs,
  summary,
}: {
  columns: DashboardStatColumn[];
  error: string | null | undefined;
  isLoading: boolean;
  labels: DashboardStatsLabels;
  onAddFirstJob: (() => void) | undefined;
  onGoJobs: ((status?: DashboardStatsStatus) => void) | undefined;
  summary: DashboardStatsSummary;
}): DashboardStatsViewModel {
  if (isLoading) {
    return {
      kind: "loading",
      message: labels.loading,
    };
  }

  if (error) {
    return {
      error,
      kind: "error",
      title: labels.errorTitle,
    };
  }

  if (summary.total === 0) {
    return {
      columns,
      ctaLabel: labels.emptyCta,
      kind: "empty",
      onAddFirstJob,
      subtitle: labels.emptySubtitle,
      title: labels.emptyTitle,
    };
  }

  return {
    columns,
    kind: "grid",
    onGoJobs,
    summary,
    title: labels.title,
  };
}
