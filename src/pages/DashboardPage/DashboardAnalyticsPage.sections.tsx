import type { TFunction } from "i18next";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "src/shared/ui";

import { DashboardTabsNav } from "./ui";

interface DashboardAnalyticsHeaderProps {
  onOpenLoopsFilter: () => void;
  t: TFunction<"dashboard">;
}

export function DashboardAnalyticsHeader({
  onOpenLoopsFilter,
  t,
}: DashboardAnalyticsHeaderProps) {
  return (
    <div className="shrink-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-3 px-1 pb-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-foreground">
            {t("tabs.analytics", "Analytics")}
          </div>

          <Button
            size="sm"
            variant="outline"
            shape="pill"
            className="gap-2"
            onClick={onOpenLoopsFilter}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("loopsFilter.button", "Loops")}
          </Button>
        </div>

        <DashboardTabsNav />
      </div>
    </div>
  );
}
