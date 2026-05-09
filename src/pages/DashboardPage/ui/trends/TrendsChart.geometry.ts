import { SERIES } from "./trends.constants";
import type { SeriesKey, TrendsPoint, VisibleMap } from "./trends.types";

export const CHART_WIDTH = 720;
export const CHART_HEIGHT = 260;
export const CHART_MARGIN = {
  top: 14,
  right: 18,
  bottom: 34,
  left: 42,
};

export const CHART_INNER_WIDTH =
  CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
const CHART_INNER_HEIGHT =
  CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

export interface SeriesLine {
  key: SeriesKey;
  path: string;
  points: ChartPoint[];
}

export interface TrendsChartModel {
  lines: SeriesLine[];
  xTicks: number[];
  yMax: number;
  yTicks: number[];
}

export function buildChartModel(
  points: TrendsPoint[],
  visible: VisibleMap,
): TrendsChartModel {
  const visibleSeries = SERIES.filter((key) => visible[key]);
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => visibleSeries.map((key) => point[key])),
  );
  const { max: yMax, ticks: yTicks } = buildYAxis(maxValue);

  const lines = visibleSeries.map((key) => {
    const seriesPoints = points.map((point, index) => ({
      x: getX(index, points.length),
      y: getY(point[key], yMax),
      value: point[key],
    }));

    return {
      key,
      path: buildLinePath(seriesPoints),
      points: seriesPoints,
    };
  });

  return {
    lines,
    xTicks: buildXTicks(points.length),
    yMax,
    yTicks,
  };
}

export function getX(index: number, count: number): number {
  if (count <= 1) return CHART_MARGIN.left + CHART_INNER_WIDTH / 2;

  return CHART_MARGIN.left + (index / (count - 1)) * CHART_INNER_WIDTH;
}

export function getY(value: number, max: number): number {
  return (
    CHART_MARGIN.top +
    CHART_INNER_HEIGHT -
    (value / max) * CHART_INNER_HEIGHT
  );
}

function buildLinePath(points: ChartPoint[]): string {
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");
}

function buildXTicks(count: number): number[] {
  if (count <= 0) return [];
  if (count <= 6) return Array.from({ length: count }, (_, index) => index);

  const last = count - 1;
  const raw = [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) =>
    Math.round(last * ratio),
  );

  return [...new Set(raw)];
}

function buildYAxis(maxValue: number): { max: number; ticks: number[] } {
  const step = Math.max(1, Math.ceil(maxValue / 4));
  const max = Math.max(step, Math.ceil(maxValue / step) * step);
  const ticks: number[] = [];

  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }

  if (ticks[ticks.length - 1] !== max) ticks.push(max);

  return { max, ticks };
}
