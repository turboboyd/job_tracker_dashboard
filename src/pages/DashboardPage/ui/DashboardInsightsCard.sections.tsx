import { Card } from "src/shared/ui";

import type { DashboardInsightKpi } from "./DashboardInsightsCard.helpers";

interface DashboardInsightsCardLayoutProps {
  kpis: DashboardInsightKpi[];
  title: string;
}

interface InsightKpiProps {
  label: string;
  value: string;
}

export function DashboardInsightsCardLayout({ kpis, title }: DashboardInsightsCardLayoutProps) {
  return (
    <Card className="p-6">
      <div className="text-sm font-semibold text-foreground">{title}</div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <InsightKpi key={kpi.id} label={kpi.label} value={kpi.value} />
        ))}
      </div>
    </Card>
  );
}

function InsightKpi({ label, value }: InsightKpiProps) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
