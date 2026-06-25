import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";

import { getMetricValueClass } from "./loopListView.helpers";
import { getLoopStatus, type LoopStats } from "./loopsPage.helpers";

type StatTileProps = {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
  green?: boolean;
};

function StatTile({ label, value, sub, accent, green }: StatTileProps) {
  const valueClass = getMetricValueClass({ accent, green });

  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px]">
      <div className="truncate text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
        {label}
      </div>
      <div
        className={`mt-2 text-[28px] font-semibold leading-none tracking-[-0.025em] tabular-nums ${valueClass}`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-[11.5px] text-subtle-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

export function LoopStatsBar({
  statsLoops,
  activeTotals,
}: {
  statsLoops: readonly Loop[];
  activeTotals: LoopStats;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-3.5">
      <StatTile
        label={t("loops.statLoops", "Loops")}
        value={statsLoops.length}
        sub={`${t("loops.tabActive", "Активные")}: ${statsLoops.filter((l) => getLoopStatus(l) === "active").length}`}
      />
      <StatTile
        label={t("loops.statMatches", "Matches")}
        value={activeTotals.matches}
        sub={t("loops.statMatchesSub", "System matches")}
      />
      <StatTile
        label={t("loops.statApplied", "Applied")}
        value={activeTotals.applied}
        sub={t("loops.statAppliedSub", "Из всех циклов")}
        accent
      />
      <StatTile
        label={t("loops.statToday", "Today")}
        value={activeTotals.today}
        sub={t("loops.statTodaySub", "Fresh today")}
        green={activeTotals.today > 0}
      />
    </div>
  );
}
