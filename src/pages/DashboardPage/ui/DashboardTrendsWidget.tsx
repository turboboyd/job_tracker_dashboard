import React, { useState } from "react";

const DATA = [3,2,4,3,5,2,1,4,6,5,3,4,7,5,4,6,8,5,7,9,6,5,7,8,5,9,11,8,9,7];
const W = 480;
const H = 120;
const PAD_X = 4;
const PAD_Y = 8;

function buildPaths(data: number[]): { area: string; line: string; lastX: number; lastY: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const n = data.length;

  const xs = data.map((_, i) => PAD_X + (i / (n - 1)) * (W - PAD_X * 2));
  const ys = data.map((v) => PAD_Y + (1 - (v - min) / range) * (H - PAD_Y * 2));

  let line = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < n; i++) {
    line += ` L ${xs[i]} ${ys[i]}`;
  }

  const area = `${line} L ${xs[n - 1]} ${H} L ${xs[0]} ${H} Z`;

  return {
    area,
    line,
    lastX: xs[n - 1],
    lastY: ys[n - 1],
  };
}

type TabKey = "created" | "updated";

export function DashboardTrendsWidget() {
  const [tab, setTab] = useState<TabKey>("created");
  const { area, line, lastX, lastY } = buildPaths(DATA);

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold tracking-[-0.015em] text-foreground">
            Тренды
          </div>
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

      {/* Summary stats */}
      <div className="mt-4 flex items-baseline gap-4">
        <div>
          <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">
            162
          </span>
          <span className="ml-1.5 text-[11px] font-medium text-emerald-600">↑24%</span>
        </div>
        <div className="text-[13px] text-subtle-foreground">
          avg <span className="tabular-nums font-medium text-foreground">5.4</span> / день
        </div>
      </div>

      {/* SVG Sparkline */}
      <div className="mt-4 overflow-hidden rounded-md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
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

          {/* Area fill */}
          <path d={area} fill="url(#tw-grad)" />

          {/* Line stroke */}
          <path
            d={line}
            fill="none"
            stroke="rgb(var(--primary))"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Last point dot */}
          <circle
            cx={lastX}
            cy={lastY}
            r="4"
            fill="rgb(var(--primary))"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}
