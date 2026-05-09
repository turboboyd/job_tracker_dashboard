import {
  DashboardStatsEmptyCard,
  DashboardStatsErrorCard,
  DashboardStatsGrid,
  DashboardStatsLoadingCard,
} from "./DashboardStats.sections";
import type { DashboardStatsViewModel } from "./DashboardStats.viewModel";

export function renderDashboardStats(viewModel: DashboardStatsViewModel) {
  switch (viewModel.kind) {
    case "loading":
      return <DashboardStatsLoadingCard message={viewModel.message} />;

    case "error":
      return <DashboardStatsErrorCard title={viewModel.title} error={viewModel.error} />;

    case "empty":
      return (
        <DashboardStatsEmptyCard
          columns={viewModel.columns}
          ctaLabel={viewModel.ctaLabel}
          onAddFirstJob={viewModel.onAddFirstJob}
          subtitle={viewModel.subtitle}
          title={viewModel.title}
        />
      );

    case "grid":
      return (
        <DashboardStatsGrid
          columns={viewModel.columns}
          onGoJobs={viewModel.onGoJobs}
          summary={viewModel.summary}
          title={viewModel.title}
        />
      );
  }
}
