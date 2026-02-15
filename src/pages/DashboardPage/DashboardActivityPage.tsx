import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { Button } from "src/shared/ui";

import { useDashboardData } from "./model/useDashboardData";
import {
  DashboardLoopsFilterModal,
  DashboardRecentJobsCard,
  DashboardTabsNav,
  DashboardTimelineCard,
} from "./ui";

export default function DashboardActivityPage() {
   const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);

  const { loops, loopsFilter, setLoopsFilter, matches, recentJobs } =
    useDashboardData();

  const goMatches = () => navigate(RoutePath[AppRoutes.MATCHES]);
  const openMatch = (id: string) =>
    navigate(`${RoutePath[AppRoutes.MATCHES]}/${id}`);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3 px-1 pt-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-foreground">
              {t("tabs.activity", "Activity")}
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

      {/* Content should fill the remaining height; scrolling happens inside cards */}
      <div className="flex flex-1 overflow-hidden p-6">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardRecentJobsCard
            className="min-h-0"
            jobs={recentJobs}
            onViewAll={goMatches}
            onOpenJob={openMatch}
          />
          <DashboardTimelineCard className="min-h-0" matches={matches} />
        </div>
      </div>
    </div>
  );
}
