import { useMemo, useState } from "react";

import type { MatchLike } from "../model/dashboardAggregations";
import { toMillis } from "../model/dashboardAggregations";

const CHART_W = 480;
const CHART_H = 120;
const PAD_X = 4;
const PAD_Y = 8;
const DAYS_COUNT = 30;

interface ChartPaths {
  area: string;
  line: string;
  lastX: number;
  lastY: number;
}

function buildChartPaths(data: number[]): ChartPaths {
  if (data.length < 2) {
    return { area: "", line: "", lastX: CHART_W, lastY: CHART_H / 2 };
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const n = data.length;
  const xs = data.map((_, i) => PAD_X + (i / (n - 1)) * (CHART_W - PAD_X * 2));
  const ys = data.map((v) => PAD_Y + (1 - (v - min) / range) * (CHART_H - PAD_Y * 2));

  let line = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < n; i++) line += ` L ${xs[i]} ${ys[i]}`;
  const area = `${line} L ${xs[n - 1]} ${CHART_H} L ${xs[0]} ${CHART_H} Z`;

  return { area, line, lastX: xs[n - 1], lastY: ys[n - 1] };
}

type TabKey = "created" | "updated";

function buildDayData(
  matches: readonly MatchLike[],
  nowMs: number,
  field: "createdAt" | "updatedAt",
): number[] {
  const start = nowMs - DAYS_COUNT * 86400000;
  const counts = Array(DAYS_COUNT).fill(0) as number[];
  for (const m of matches) {
    const ms = toMillis(m[field]);
    if (ms >= start && ms <= nowMs) {
      const idx = Math.floor((ms - start) / 86400000);
      if (idx >= 0 && idx < DAYS_COUNT) counts[idx]++;
    }
  }
  return counts;
}

export function DashboardTrendsWidget({ matches }: { matches: readonly MatchLike[] }) {
  const [tab, setTab] = useState<TabKey>("created");
  const [nowMs] = useState(() => Date.now());

  const dayData = useMemo(
    () => buildDayData(matches, nowMs, tab === "created" ? "createdAt" : "updatedAt"),
    [matches, nowMs, tab],
  );

  const total = useMemo(() => dayData.reduce((s, v) => s + v, 0), [dayData]);
  const avgPerDay = total > 0 ? (total / DAYS_COUNT).toFixed(1) : "0";

  const { area, line, lastX, lastY } = useMemo(() => buildChartPaths(dayData), [dayData]);

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold tracking-[-0.015em] text-foreground">Тренды</div>
          <div className="mt-0.5 text-[12px] text-subtle-foreground">30 дней</div>
        </div>
        <div className="flex items-center gap-1.5">
          {(["created", "updated"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={[
                "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                tab === k
                  ? "border-foreground/20 bg-muted text-foreground"
                  : "border-border text-subtle-foreground hover:bg-muted/60",
              ].join(" ")}
            >
              {k === "created" ? "Создано" : "Обновлено"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-4">
        <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">
          {total}
        </span>
        <div className="text-[13px] text-subtle-foreground">
          avg <span className="tabular-nums font-medium text-foreground">{avgPerDay}</span> / день
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-md">
        {total > 0 ? (
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            width="100%"
            height="120"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="tw-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.18" />
                <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#tw-grad)" />
            <path
              d={line}
              fill="none"
              stroke="rgb(var(--primary))"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={lastX} cy={lastY} r="4" fill="rgb(var(--primary))" stroke="white" strokeWidth="1.5" />
          </svg>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-[12px] text-subtle-foreground">
            Нет данных за период
          </div>
        )}
      </div>
    </div>
  );
}
