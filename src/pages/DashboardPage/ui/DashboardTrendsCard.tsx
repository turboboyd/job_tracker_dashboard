import { LineChart, type CustomTooltipProps } from "@tremor/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "src/shared/ui";

import {
  buildDailyBuckets,
  buildMonthlyBuckets,
  buildWeeklyBuckets,
  type MatchTimestampsLike,
} from "../model/dashboardTimeSeries";

type RangeKey = "7d" | "30d" | "90d" | "12m";
type ModeKey = "created" | "updated";
type SeriesKey = "applied" | "interview" | "offer" | "rejected";

const SERIES: SeriesKey[] = ["applied", "interview", "offer", "rejected"];

const TREMOR_COLORS: Record<SeriesKey, "sky" | "violet" | "emerald" | "rose"> = {
  applied: "sky",
  interview: "violet",
  offer: "emerald",
  rejected: "rose",
};

const LEGEND_COLOR: Record<SeriesKey, string> = {
  applied: "rgb(14 165 233)", // sky-500
  interview: "rgb(139 92 246)", // violet-500
  offer: "rgb(16 185 129)", // emerald-500
  rejected: "rgb(244 63 94)", // rose-500
};

function toNumberSafe(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatLabel(dateMs: number, locale: string, range: RangeKey) {
  const d = new Date(dateMs);

  if (range === "12m") {
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
  }

  if (range === "7d") {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
  }

  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(d);
}

function SegButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-medium transition",
        "outline-none focus:outline-none focus-visible:outline-none",
        // убираем любые ring-обводки с кнопок, чтобы не было жёлтых подсветок
        "focus-visible:ring-0 focus-visible:ring-offset-0",
        active
          ? "bg-foreground/10 text-foreground"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SegGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1 rounded-full border bg-background p-1">{children}</div>;
}

function TrendsTooltip(props: CustomTooltipProps) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const { active, payload, label } = props;

  if (!active || !payload || payload.length === 0) return null;

  const title = typeof label === "string" ? label : String(label ?? "");

  const items = payload
    .filter((p) => SERIES.includes(p.dataKey as SeriesKey))
    .map((p) => {
      const key = p.dataKey as SeriesKey;
      return {
        key,
        label: String(t(`status.${key}`, { defaultValue: key })),
        value: toNumberSafe(p.value),
      };
    })
    .sort((a, b) => SERIES.indexOf(a.key) - SERIES.indexOf(b.key));

  return (
    <div className="min-w-[220px] rounded-xl border border-border bg-background/95 p-3 shadow-md backdrop-blur">
      <div className="text-xs font-semibold text-foreground">{title}</div>

      <div className="mt-2 space-y-2">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: LEGEND_COLOR[it.key] }}
              />
              <span className="text-muted-foreground">{it.label}</span>
            </div>
            <span className="font-semibold text-foreground">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardTrendsCard({ matches }: { matches: MatchTimestampsLike[] }) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const [range, setRange] = useState<RangeKey>("90d");
  const [mode, setMode] = useState<ModeKey>("created");

  const buckets = useMemo(() => {
    const byUpdatedAt = mode === "updated";

    if (range === "12m") {
      return buildMonthlyBuckets(matches, { months: 12, byUpdatedAt, locale: i18n.language });
    }

    if (range === "7d") {
      return buildDailyBuckets(matches, { days: 7, byUpdatedAt, locale: i18n.language });
    }

    if (range === "30d") {
      return buildWeeklyBuckets(matches, { weeks: 5, byUpdatedAt, locale: i18n.language });
    }

    return buildWeeklyBuckets(matches, { weeks: 13, byUpdatedAt, locale: i18n.language });
  }, [matches, mode, range, i18n.language]);

  const chartData = useMemo(() => {
    return buckets.map((b) => {
      const applied = toNumberSafe(b.counts.applied);
      const interview = toNumberSafe(b.counts.interview);
      const offer = toNumberSafe(b.counts.offer);
      const rejected = toNumberSafe(b.counts.rejected);

      return {
        // label короткий и локализованный → без xAxisLabelFormatter
        date: formatLabel(b.startMs, i18n.language, range),
        applied,
        interview,
        offer,
        rejected,
      };
    });
  }, [buckets, i18n.language, range]);

  const totalInRange = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.applied + d.interview + d.offer + d.rejected, 0);
  }, [chartData]);

  const subtitle = useMemo(() => {
    const modeLabel =
      mode === "updated"
        ? String(t("trends.mode.updated", { defaultValue: "By last update" }))
        : String(t("trends.mode.created", { defaultValue: "By creation date" }));
    const rangeLabel = String(t(`range.${range}`, { defaultValue: range }));
    return `${modeLabel} · ${rangeLabel}`;
  }, [mode, range, t]);

  const legend = useMemo(() => {
    return SERIES.map((k) => ({
      key: k,
      label: String(t(`status.${k}`, { defaultValue: k })),
      color: LEGEND_COLOR[k],
    }));
  }, [t]);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">
            {String(t("trends.title", { defaultValue: "Trends" }))}
          </div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegGroup>
            {(["7d", "30d", "90d", "12m"] as const).map((k) => (
              <SegButton key={k} active={range === k} onClick={() => setRange(k)}>
                {String(t(`range.${k}`, { defaultValue: k }))}
              </SegButton>
            ))}
          </SegGroup>

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

          <SegGroup>
            <SegButton active={mode === "created"} onClick={() => setMode("created")}>
              {String(t("trends.created", { defaultValue: "Created" }))}
            </SegButton>
            <SegButton active={mode === "updated"} onClick={() => setMode("updated")}>
              {String(t("trends.updated", { defaultValue: "Updated" }))}
            </SegButton>
          </SegGroup>
        </div>
      </div>

      <div className="mt-6">
        {totalInRange === 0 ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl border bg-muted/20 px-6 py-10 text-center">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                {String(t("trends.emptyTitle", { defaultValue: "No data yet" }))}
              </div>
              <div className="text-xs text-muted-foreground">
                {String(
                  t("trends.emptySubtitle", {
                    defaultValue: "Add jobs and update statuses to see trends here.",
                  }),
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-background p-3">
            <LineChart
              className="h-[260px]"
              data={chartData}
              index="date"
              categories={SERIES}
              colors={SERIES.map((k) => TREMOR_COLORS[k])}
              showLegend={false}
              showYAxis
              showGridLines
              connectNulls
              curveType="monotone"
              yAxisWidth={42}
              tickGap={24}
              valueFormatter={(v: number) => String(toNumberSafe(v))}
              customTooltip={(p) => <TrendsTooltip {...p} />}
            />
          </div>
        )}
      </div>

      {totalInRange > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {legend.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
