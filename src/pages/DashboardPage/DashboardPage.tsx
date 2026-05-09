import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui";

import { useDashboardPageController } from "./model/useDashboardPageController";
import {
  DashboardFollowUpsCard,
  DashboardLoopsFilterModal,
  DashboardOnboardingActions,
  DashboardPipelineCard,
  DashboardPlanCard,
  DashboardRecentJobsCard,
  DashboardStats,
  DashboardTabsNav,
} from "./ui";

export default function DashboardPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const {
    loopsModalOpen,
    setLoopsModalOpen,
    loopsForModal,
    dashboard: {
      loopsFilter,
      setLoopsFilter,
      isLoading,
      error,
      hasMatches,
      planItems,
      recent,
      pipelineSummary,
    },
    actions,
  } = useDashboardPageController();

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
                onGoProfile={actions.goProfile}
                onGoQuestions={actions.goQuestions}
                onGoLoop={actions.goLoop}
                onGoJobs={actions.goMatches}
              />

              <DashboardRecentJobsCard
                jobs={recent}
                onOpenJob={actions.goApplicationDetails}
                onViewAll={actions.goMatches}
              />
              <DashboardPipelineCard
                summary={pipelineSummary}
                size={240}
                stroke={16}
              />
            </div>

            <DashboardPlanCard
              error={error}
              isLoading={isLoading}
              items={planItems}
              onOpenApplication={actions.goApplicationDetails}
            />

            <DashboardFollowUpsCard />
          </div>

          <DashboardStats
            isLoading={isLoading}
            error={error}
            summary={pipelineSummary}
            onGoJobs={actions.goApplicationsByStatus}
            onAddFirstJob={actions.focusAddApplication}
          />
        </div>
      </div>
    </div>
  );
}
