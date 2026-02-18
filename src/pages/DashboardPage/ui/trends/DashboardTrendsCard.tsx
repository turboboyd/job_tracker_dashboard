import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Card } from "src/shared/ui";

import type { MatchTimestampsLike } from "../../model/dashboardTimeSeries";

import { SERIES } from "./trends.constants";
import type { ModeKey, RangeKey, SeriesKey, VisibleMap } from "./trends.types";
import { TrendsChart } from "./TrendsChart";
import { TrendsLegend } from "./TrendsLegend";
import { useTrendsBuckets, useTrendsChartData, useTrendsTotal } from "./useTrendsData";

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
    <Button
      onClick={onClick}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      shape="pill"
      shadow="none"
      className={[
        "h-9 px-3 text-xs",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Button>
  );
}

function SegGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1 rounded-full border bg-background p-1">{children}</div>;
}

export function DashboardTrendsCard({ matches }: { matches: MatchTimestampsLike[] }) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const [range, setRange] = useState<RangeKey>("90d");
  const [mode, setMode] = useState<ModeKey>("created");

  const [visible, setVisible] = useState<VisibleMap>({
    applied: true,
    interview: true,
    offer: true,
    rejected: true,
  });
  const [hoverKey, setHoverKey] = useState<SeriesKey | null>(null);

  const buckets = useTrendsBuckets({
    matches,
    range,
    mode,
    locale: i18n.language,
  });

  const chartData = useTrendsChartData({
    buckets,
    range,
    locale: i18n.language,
  });

  const totalInRange = useTrendsTotal(chartData);

  const subtitle = useMemo(() => {
    const modeLabel =
      mode === "updated"
        ? String(t("trends.mode.updated", { defaultValue: "By last update" }))
        : String(t("trends.mode.created", { defaultValue: "By creation date" }));
    const rangeLabel = String(t(`range.${range}`, { defaultValue: range }));
    return `${modeLabel} · ${rangeLabel}`;
  }, [mode, range, t]);

  const activeSeries = useMemo(() => {
    const picked = SERIES.filter((k) => visible[k]);
    return picked.length === 0 ? SERIES : picked;
  }, [visible]);

  function toggleSeries(key: SeriesKey) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
            <TrendsChart data={chartData} activeSeries={activeSeries} visible={visible} hoverKey={hoverKey} />
          </div>
        )}
      </div>

      {totalInRange > 0 && (
        <TrendsLegend
          visible={visible}
          hoverKey={hoverKey}
          onToggle={toggleSeries}
          onHover={setHoverKey}
        />
      )}
    </Card>
  );
}
