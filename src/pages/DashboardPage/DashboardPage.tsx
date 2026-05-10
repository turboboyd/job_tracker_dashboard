import { Bell, Plus, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";

import { useDashboardData } from "./model/useDashboardData";
import {
  DashboardLoopsFilterModal,
  DashboardOnboardingActions,
  DashboardPipelineCard,
  DashboardRecentJobsCard,
  DashboardStats,
  DashboardTabsNav,
  DashboardTrendsWidget,
  DashboardGoalsWidget,
  DashboardInsightsWidget,
} from "./ui";
import { StatCard } from "./ui/StatCard";

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
  const goMatches = () => navigate(RoutePath[AppRoutes.APPLICATIONS]);

  const loopsForModal = useMemo(
    () =>
      loops
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((l) => ({ id: l.id, name: l.name })),
    [loops],
  );

  const total = pipelineSummary.total;
  const active = pipelineSummary.byColumn["ACTIVE"] ?? 0;
  const interview = pipelineSummary.byColumn["INTERVIEW"] ?? 0;
  const offer = pipelineSummary.byColumn["OFFER"] ?? 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-7 pt-5 pb-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
                <span>Loopboard</span>
                <span>/</span>
                <span className="text-muted-foreground">Workspace</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                {t("tabs.overview", "Overview")}
              </h1>
            </div>

            <div className="flex items-center gap-2 pb-3">
              <button
                type="button"
                onClick={() => setLoopsModalOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-subtle-foreground" />
                {t("loopsFilter.button", "Loops")} · {loops.length}
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Bell className="h-3.5 w-3.5 text-subtle-foreground" />
              </button>
              <button
                type="button"
                onClick={goMatches}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("addApplication", "New application")}
              </button>
            </div>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-background pb-12">
        <div className="flex flex-col gap-3.5 p-7">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            <StatCard
              label={t("stats.total", "Total applications")}
              value={total}
              sub={t("stats.last30", "last 30 days")}
            />
            <StatCard
              label={t("stats.active", "Active")}
              value={active}
              sub={t("stats.inProgress", "in progress")}
              accent
            />
            <StatCard
              label={t("stats.interviews", "Interviews")}
              value={interview}
              sub={t("stats.scheduled", "scheduled")}
            />
            <StatCard
              label={t("stats.offers", "Offers")}
              value={offer}
              sub={t("stats.received", "received")}
            />
          </div>

          <DashboardStats
            isLoading={isLoading}
            error={error}
            summary={pipelineSummary}
            onGoJobs={(status) => {
              if (!status) return navigate(RoutePath[AppRoutes.APPLICATIONS]);
              return navigate(`${RoutePath[AppRoutes.APPLICATIONS]}?col=${status}`);
            }}
            onAddFirstJob={() =>
              navigate(`${RoutePath[AppRoutes.APPLICATIONS]}?focus=add`)
            }
          />

          {/* Row 2: Trends + Funnel */}
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <DashboardTrendsWidget />
            <DashboardPipelineCard summary={pipelineSummary} size={180} stroke={16} />
          </div>

          {/* Row 3: Plan/Onboarding + Goals */}
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <DashboardOnboardingActions
              hasJobs={hasMatches}
              onGoProfile={goProfile}
              onGoQuestions={goQuestions}
              onGoLoop={goLoop}
              onGoJobs={goMatches}
            />
            <DashboardGoalsWidget />
          </div>

          {/* Row 4: Recent jobs + Insights */}
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <DashboardRecentJobsCard jobs={recent} onViewAll={goMatches} />
            <DashboardInsightsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
