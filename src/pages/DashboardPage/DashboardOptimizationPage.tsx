import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui";

import { useDashboardData } from "./model/useDashboardData";
import {
  DashboardLoopsFilterModal,
  DashboardTabsNav,
} from "./ui";

export default function DashboardOptimizationPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const { loops, loopsFilter, setLoopsFilter } = useDashboardData();

  const [loopsModalOpen, setLoopsModalOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3 px-1 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-foreground">
              {t("tabs.optimization", "Optimization")}
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
    </div>
  );
}
