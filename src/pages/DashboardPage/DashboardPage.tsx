import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
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
  DashboardOnboardingActions,
  DashboardPipelineCard,
  DashboardRecentJobsCard,
  DashboardStats,
  DashboardTabsNav,
} from "./ui";

export default function DashboardPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);

  const {
    loops,
    loopsFilter,
    setLoopsFilter,
    isLoading,
    error,
    hasMatches,
    recent,
    pipelineSummary,
  } = useDashboardData();

  const goProfile = () => navigate(RoutePath[AppRoutes.SETTINGS_PROFILE]);
  const goQuestions = () => navigate(RoutePath[AppRoutes.PROFILE_QUESTIONS]);
  const goLoop = () => navigate(RoutePath[AppRoutes.LOOPS]);
  const goMatches = () => navigate(RoutePath[AppRoutes.MATCHES]);

  // Чтобы не сортировать/маппить на каждый рендер
  const loopsForModal = useMemo(
    () =>
      loops
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((l) => ({ id: l.id, name: l.name })),
    [loops],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3 px-1 pb-4 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-foreground">
              {t("tabs.overview")}
            </div>

            <Button
              size="sm"
              variant="outline"
              shape="pill"
              onClick={() => setLoopsModalOpen(true)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("loopsFilter.button")}
            </Button>
          </div>

          <DashboardTabsNav />
        </div>
      </div>

      <DashboardLoopsFilterModal
        open={loopsModalOpen}
        onOpenChange={setLoopsModalOpen}
        loops={loopsForModal}
        value={loopsFilter}
        onChange={setLoopsFilter}
      />

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="space-y-6 p-6">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">
              {t("onboardingTitle")}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <DashboardOnboardingActions
                hasJobs={hasMatches}
                onGoProfile={goProfile}
                onGoQuestions={goQuestions}
                onGoLoop={goLoop}
                onGoJobs={goMatches}
              />

              <DashboardRecentJobsCard jobs={recent} onViewAll={goMatches} />
              <DashboardPipelineCard
                summary={pipelineSummary}
                size={240}
                stroke={16}
              />
            </div>
          </div>

          <DashboardStats
            isLoading={isLoading}
            error={error}
            summary={pipelineSummary}
            onGoJobs={(status) => {
              if (!status) return navigate(RoutePath[AppRoutes.MATCHES]);
              return navigate(`${RoutePath[AppRoutes.MATCHES]}?status=${status}`);
            }}
            onAddFirstJob={() =>
              navigate(`${RoutePath[AppRoutes.MATCHES]}?focus=add`)
            }
          />
        </div>
      </div>
    </div>
  );
}
