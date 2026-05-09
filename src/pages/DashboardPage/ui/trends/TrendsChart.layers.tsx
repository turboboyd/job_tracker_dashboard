import { DASH, LEGEND_COLOR, formatLabel } from "./trends.constants";
import type { SeriesKey, TrendsPoint } from "./trends.types";
import {
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_WIDTH,
  getX,
  getY,
  type SeriesLine,
} from "./TrendsChart.geometry";

interface TrendsYAxisGridProps {
  yMax: number;
  yTicks: number[];
}

interface TrendsXAxisLabelsProps {
  points: TrendsPoint[];
  xTicks: number[];
}

interface TrendLinesProps {
  hoverKey: SeriesKey | null;
  lines: SeriesLine[];
}

interface TrendsHoverMarkerProps {
  hoverIndex: number;
  hoverX: number;
  lines: SeriesLine[];
}

export function TrendsYAxisGrid({ yMax, yTicks }: TrendsYAxisGridProps) {
  return (
    <>
      {yTicks.map((tick) => {
        const y = getY(tick, yMax);

        return (
          <g key={tick}>
            <line
              x1={CHART_MARGIN.left}
              x2={CHART_WIDTH - CHART_MARGIN.right}
              y1={y}
              y2={y}
              stroke="rgb(var(--border))"
              strokeDasharray="3 3"
              opacity={0.72}
            />
            <text
              x={CHART_MARGIN.left - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {tick}
            </text>
          </g>
        );
      })}
    </>
  );
}

export function TrendsXAxisLabels({ points, xTicks }: TrendsXAxisLabelsProps) {
  return (
    <>
      {xTicks.map((index) => {
        const point = points[index];
        if (!point) return null;

        return (
          <text
            key={`${point.date}-${index}`}
            x={getX(index, points.length)}
            y={CHART_HEIGHT - 9}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {formatLabel(point.date)}
          </text>
        );
      })}
    </>
  );
}

export function TrendLines({ hoverKey, lines }: TrendLinesProps) {
  return (
    <>
      {lines.map((line) => {
        const isDim = hoverKey != null && hoverKey !== line.key;

        return (
          <path
            key={line.key}
            d={line.path}
            fill="none"
            stroke={LEGEND_COLOR[line.key]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={DASH[line.key]}
            opacity={isDim ? 0.25 : 1}
          />
        );
      })}
    </>
  );
}

export function TrendsHoverMarker({
  hoverIndex,
  hoverX,
  lines,
}: TrendsHoverMarkerProps) {
  return (
    <g>
      <line
        x1={hoverX}
        x2={hoverX}
        y1={CHART_MARGIN.top}
        y2={CHART_HEIGHT - CHART_MARGIN.bottom}
        stroke="rgb(var(--muted-foreground))"
        strokeDasharray="3 3"
        opacity={0.65}
      />
      {lines.map((line) => {
        const point = line.points[hoverIndex];
        if (!point) return null;

        return (
          <circle
            key={line.key}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={LEGEND_COLOR[line.key]}
            stroke="rgb(var(--background))"
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
}
