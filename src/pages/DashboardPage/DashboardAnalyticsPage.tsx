import { useTranslation } from "react-i18next";

import { DashboardAnalyticsHeader } from "./DashboardAnalyticsPage.sections";
import { useDashboardAnalyticsPageController } from "./model/useDashboardAnalyticsPageController";
import {
  DashboardCrmFunnelCard,
  DashboardInsightsCard,
  DashboardLoopsFilterModal,
  DashboardStatusRadarCard,
  DashboardTrendsCard,
} from "./ui";

export function DashboardAnalyticsPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const analytics = useDashboardAnalyticsPageController();

  return (
    <div className="flex h-full flex-col">
      <DashboardAnalyticsHeader
        t={t}
        onOpenLoopsFilter={() => analytics.setLoopsModalOpen(true)}
      />

      <DashboardLoopsFilterModal
        open={analytics.loopsModalOpen}
        onOpenChange={analytics.setLoopsModalOpen}
        value={analytics.dashboard.loopsFilter}
        loops={analytics.dashboard.loops}
        onChange={analytics.dashboard.setLoopsFilter}
      />

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="space-y-6 p-6">
          <DashboardTrendsCard
            matches={analytics.dashboard.chartMatches}
            range={analytics.range}
            mode={analytics.mode}
            customRange={analytics.customRange}
            onRangeChange={analytics.setRange}
            onModeChange={analytics.setMode}
            onCustomRangeChange={analytics.setCustomRange}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardInsightsCard matches={analytics.filteredMatches} />
            <DashboardStatusRadarCard matches={analytics.filteredMatches} />
          </div>

          <DashboardCrmFunnelCard />
        </div>
      </div>
    </div>
  );
}

export default DashboardAnalyticsPage;
