import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DASH, LEGEND_COLOR } from "./trends.constants";
import type { SeriesKey, TrendsPoint, VisibleMap } from "./trends.types";
import { TrendsTooltip } from "./TrendsTooltip";

export function TrendsChart({
  data,
  activeSeries,
  visible,
  hoverKey,
}: {
  data: TrendsPoint[];
  activeSeries: SeriesKey[];
  visible: VisibleMap;
  hoverKey: SeriesKey | null;
}) {
  function seriesOpacity(key: SeriesKey): number {
    if (!visible[key]) return 0;
    if (!hoverKey) return key === "applied" || key === "offer" ? 0.85 : 1;
    return hoverKey === key ? 1 : 0.18;
  }

  function seriesWidth(key: SeriesKey): number {
    if (hoverKey === key) return 3;
    return 2.2;
  }

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
            tick={{ fontSize: 12 }}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            width={42}
            allowDecimals={false}
            tick={{ fontSize: 12 }}
          />

          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload, label }) => (
              <TrendsTooltip active={active} payload={payload} label={label} />
            )}
          />

          {/* Solid first */}
          {activeSeries.includes("applied") && (
            <Line
              type="monotone"
              dataKey="applied"
              stroke={LEGEND_COLOR.applied}
              strokeWidth={seriesWidth("applied")}
              strokeOpacity={seriesOpacity("applied")}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          )}

          {activeSeries.includes("offer") && (
            <Line
              type="monotone"
              dataKey="offer"
              stroke={LEGEND_COLOR.offer}
              strokeWidth={seriesWidth("offer")}
              strokeOpacity={seriesOpacity("offer")}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          )}

          {/* Dashed on top */}
          {activeSeries.includes("interview") && (
            <Line
              type="monotone"
              dataKey="interview"
              stroke={LEGEND_COLOR.interview}
              strokeWidth={seriesWidth("interview")}
              strokeOpacity={seriesOpacity("interview")}
              strokeDasharray={DASH.interview}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          )}

          {activeSeries.includes("rejected") && (
            <Line
              type="monotone"
              dataKey="rejected"
              stroke={LEGEND_COLOR.rejected}
              strokeWidth={seriesWidth("rejected")}
              strokeOpacity={seriesOpacity("rejected")}
              strokeDasharray={DASH.rejected}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
