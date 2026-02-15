import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui";

import { useDashboardData } from "./model/useDashboardData";
import {
  DashboardLoopsFilterModal,
  DashboardTabsNav,
  DashboardTrendsCard,
  DashboardInsightsCard,
  DashboardStatusRadarCard,
} from "./ui";

export function DashboardAnalyticsPage() {
    const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);

  const { loops, loopsFilter, setLoopsFilter, chartMatches } =
    useDashboardData();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3 px-1 pt-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-foreground">
              {t("tabs.analytics", "Analytics")}
            </div>

            <Button
              size="sm"
              variant="outline"
              shape="pill"
              className="gap-2"
              onClick={() => setLoopsModalOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("loopsFilter.button", "Loops")}
            </Button>
          </div>

          <DashboardTabsNav />
        </div>
      </div>

      <DashboardLoopsFilterModal
        open={loopsModalOpen}
        onOpenChange={setLoopsModalOpen}
        value={loopsFilter}
        loops={loops}
        onChange={setLoopsFilter}
      />

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="space-y-6 p-6">
          <DashboardTrendsCard matches={chartMatches} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardInsightsCard matches={chartMatches} />
            <DashboardStatusRadarCard matches={chartMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAnalyticsPage;
