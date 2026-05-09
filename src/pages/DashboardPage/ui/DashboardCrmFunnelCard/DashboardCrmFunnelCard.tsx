import { Mail, MessageSquare, Phone, TrendingUp, Users, Zap } from "lucide-react";
import type { ElementType, ReactNode } from "react";

import type { InteractionDoc } from "src/entities/contact";
import { classNames } from "src/shared/lib";
import { Card } from "src/shared/ui/Card";
import { InlineError } from "src/shared/ui/InlineError";

import type {
  ChannelStat,
  CrmFunnelMetrics,
  FunnelStage,
} from "./crmFunnel.metrics";
import { useDashboardCrmFunnelController } from "./useDashboardCrmFunnelController";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const CHANNEL_ICON: Record<InteractionDoc["type"], ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MESSAGE: MessageSquare,
  MEETING: Users,
  OTHER: Zap,
};

const CHANNEL_COLOR: Record<InteractionDoc["type"], string> = {
  CALL: "text-blue-500",
  EMAIL: "text-violet-500",
  MESSAGE: "text-emerald-500",
  MEETING: "text-amber-500",
  OTHER: "text-muted-foreground",
};

function getConversionRateClass(rate: number): string {
  if (rate >= 50) {
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400";
  }
  if (rate >= 20) {
    return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
  }
  return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400";
}

// ─── Funnel bar ───────────────────────────────────────────────────────────────

function FunnelBar({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.count ?? 1;

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => {
        const widthPct = max > 0 ? (stage.count / max) * 100 : 0;
        const isFirst = idx === 0;

        return (
          <div key={stage.id} className="space-y-0.5">
            {/* Label row */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{stage.label}</span>
              <div className="flex items-center gap-2">
                {stage.conversionRate !== null ? (
                  <span
                    className={classNames(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                      getConversionRateClass(stage.conversionRate),
                    )}
                  >
                    {stage.conversionRate}%
                  </span>
                ) : null}
                <span className="tabular-nums text-muted-foreground">
                  {stage.count}
                </span>
              </div>
            </div>

            {/* Bar */}
            <div className="h-6 w-full overflow-hidden rounded bg-muted/50">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.color,
                  opacity: isFirst ? 1 : 0.85,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Channel row ──────────────────────────────────────────────────────────────

function ChannelRow({ stat }: { stat: ChannelStat }) {
  const Icon = CHANNEL_ICON[stat.type];

  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
        <Icon
          className={classNames("h-4 w-4 shrink-0", CHANNEL_COLOR[stat.type])}
          aria-hidden="true"
        />
      </div>

      {/* Label + bar */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">{stat.label}</span>
          <span className="tabular-nums text-muted-foreground">
            {stat.count} logged
          </span>
        </div>

        {/* Conversion bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${stat.conversionRate}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">
            {stat.conversionRate}%
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {stat.interviewCount} led to interview
        </p>
      </div>
    </div>
  );
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

function KpiStrip({ metrics }: { metrics: CrmFunnelMetrics }) {
  const avgPerAppValue =
    metrics.totalApplications > 0 ? `${metrics.avgInteractionsPerApp}×` : "—";
  const appToInterviewRate = metrics.stages[2]?.conversionRate;
  const appToInterviewValue =
    appToInterviewRate !== null && appToInterviewRate !== undefined
      ? `${appToInterviewRate}%`
      : "—";

  const kpis = [
    {
      label: "Total apps",
      value: String(metrics.totalApplications),
    },
    {
      label: "Interactions",
      value: String(metrics.totalInteractions),
    },
    {
      label: "Avg per app",
      value: avgPerAppValue,
    },
    {
      label: "App → Interview",
      value: appToInterviewValue,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-border bg-background px-3 py-2"
        >
          <p className="text-xs text-muted-foreground">{kpi.label}</p>
          <p className="mt-0.5 text-lg font-semibold text-foreground">
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Empty / skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-8 animate-pulse rounded-lg bg-muted/50"
          style={{ width: `${100 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
      <p className="text-sm font-medium text-foreground">No data yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Add applications and log interactions to see your conversion funnel.
      </p>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function DashboardCrmFunnelCard() {
  const { metrics, isLoading, error } = useDashboardCrmFunnelController();

  const hasData = metrics && metrics.totalApplications > 0;
  let content: ReactNode;

  if (isLoading) {
    content = <Skeleton />;
  } else if (error) {
    content = <InlineError message={error} />;
  } else if (!hasData || !metrics) {
    content = <EmptyState />;
  } else {
    content = (
      <>
        {/* KPI strip */}
        <KpiStrip metrics={metrics} />

        {/* Funnel */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Application pipeline
          </p>
          <FunnelBar stages={metrics.stages} />
        </div>

        {/* Channel breakdown */}
        {metrics.channels.length > 0 ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Interactions → Interview conversion by channel
            </p>
            <div className="space-y-3">
              {metrics.channels.map((stat) => (
                <ChannelRow key={stat.type} stat={stat} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Log interactions to see channel breakdown.
          </p>
        )}
      </>
    );
  }

  return (
    <Card padding="md" shadow="sm" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-base font-semibold text-foreground">
            CRM Conversion Funnel
          </span>
        </div>
      </div>

      {/* Content */}
      {content}
    </Card>
  );
}
