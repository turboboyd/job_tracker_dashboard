import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { toMillis } from "src/shared/lib/firestore/toMillis";
import { Button } from "src/shared/ui";

import { useDashboardData } from "./model/useDashboardData";
import {
  DashboardLoopsFilterModal,
  DashboardTabsNav,
  DashboardTrendsCard,
  DashboardInsightsCard,
  DashboardStatusRadarCard,
} from "./ui";
import type { ModeKey, RangeKey } from "./ui/trends/trends.types";

type CustomRange = { from: Date; to: Date } | null;

function clampDayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function presetDays(range: Exclude<RangeKey, "custom">): number {
  if (range === "12m") return 365;
  if (range === "90d") return 90;
  if (range === "30d") return 30;
  return 7;
}

export function DashboardAnalyticsPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);

  // Stable "now" so memo calculations are deterministic (lint: react-hooks/purity)
  const [nowMs] = useState(() => Date.now());

  const [range, setRange] = useState<RangeKey>("7d");
  const [mode, setMode] = useState<ModeKey>("created");
  const [customRange, setCustomRange] = useState<CustomRange>(null);

  const { loops, loopsFilter, setLoopsFilter, chartMatches } = useDashboardData();

  const filteredMatches = useMemo(() => {
    let fromMs = 0;
    let toMs = nowMs;

    if (range === "custom" && customRange) {
      fromMs = clampDayStart(customRange.from.getTime());
      toMs = clampDayStart(customRange.to.getTime()) + 24 * 60 * 60 * 1000 - 1;
    } else {
      const days = presetDays(range as Exclude<RangeKey, "custom">);
      fromMs = nowMs - days * 24 * 60 * 60 * 1000;
      toMs = nowMs;
    }

    return chartMatches.filter((m) => {
      const ts =
        mode === "updated"
          ? toMillis(m.updatedAt) || toMillis(m.createdAt)
          : toMillis(m.createdAt);
      if (!ts) return false;
      return ts >= fromMs && ts <= toMs;
    });
  }, [chartMatches, range, mode, customRange, nowMs]);

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
          <DashboardTrendsCard
            matches={chartMatches}
            range={range}
            mode={mode}
            customRange={customRange}
            onRangeChange={setRange}
            onModeChange={setMode}
            onCustomRangeChange={setCustomRange}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardInsightsCard matches={filteredMatches} />
            <DashboardStatusRadarCard matches={filteredMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAnalyticsPage;
