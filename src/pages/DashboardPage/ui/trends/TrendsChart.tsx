import React from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { DASH, LEGEND_COLOR, SERIES, SERIES_LABELS, formatLabel } from "./trends.constants";
import type { ModeKey, SeriesKey, TrendsPoint, VisibleMap } from "./trends.types";

export function TrendsChart({
  points,
  mode,
  visible,
  hoverKey,
}: {
  points: TrendsPoint[];
  mode: ModeKey;
  visible: VisibleMap;
  hoverKey: SeriesKey | null;
}) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={20}
            tickFormatter={formatLabel}
          />
          <YAxis width={40} tickLine={false} axisLine={false} tickMargin={8} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(v: unknown, name: unknown) => {
              const key = String(name) as SeriesKey;
              const num = typeof v === "number" ? v : Number(v);
              return [Number.isFinite(num) ? Math.round(num) : 0, SERIES_LABELS[key]];
            }}
            labelFormatter={(l) => `${l} · ${mode}`}
          />

          {SERIES.map((k) => {
            if (!visible[k]) return null;
            const isDim = hoverKey != null && hoverKey !== k;
            return (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={LEGEND_COLOR[k]}
                strokeWidth={2}
                dot={false}
                strokeDasharray={DASH[k]}
                opacity={isDim ? 0.25 : 1}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
