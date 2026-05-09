import { useMemo } from "react";

import { clamp, polarPoint, pointsToPath } from "./RadarChart.geometry";
import type {
  RadarAxis,
  RadarAxisLine,
  RadarChartProps,
  RadarLabel,
  RadarPoint,
  RadarSeriesPath,
} from "./RadarChart.types";

interface RadarChartModel<K extends string> {
  axisLines: RadarAxisLine[];
  gridPolygons: RadarPoint[][];
  labels: RadarLabel<K>[];
  seriesPaths: RadarSeriesPath[];
}

type RadarChartModelParams<K extends string> = Required<
  Pick<RadarChartProps<K>, "levels" | "maxValue" | "size">
> & Pick<RadarChartProps<K>, "axes" | "series">;

export function useRadarChartModel<K extends string>({
  axes,
  series,
  size,
  maxValue,
  levels,
}: RadarChartModelParams<K>): RadarChartModel<K> {
  const n = axes.length;
  const pad = 34;
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(10, size / 2 - pad);

  const angles = useMemo(() => {
    if (n === 0) return [] as number[];
    const base = -Math.PI / 2;
    const step = (2 * Math.PI) / n;
    return Array.from({ length: n }, (_, i) => base + i * step);
  }, [n]);

  const gridPolygons = useMemo(() => {
    const levelCount = Math.max(1, levels);
    return Array.from({ length: levelCount }, (_, i) => {
      const k = (i + 1) / levelCount;
      return angles.map((angle) => polarPoint(cx, cy, radius * k, angle));
    });
  }, [angles, cx, cy, levels, radius]);

  const axisLines = useMemo(() => {
    return angles.map((angle) => ({
      from: { x: cx, y: cy },
      to: polarPoint(cx, cy, radius, angle),
    }));
  }, [angles, cx, cy, radius]);

  const seriesPaths = useMemo(() => {
    return series.map((item) => {
      const pts = axes.map((axis, idx) => {
        const raw = item.values[axis.key] ?? 0;
        const v = clamp(raw, 0, maxValue) / maxValue;
        return polarPoint(cx, cy, radius * v, angles[idx] ?? 0);
      });
      return { key: item.key, color: item.color, d: pointsToPath(pts) };
    });
  }, [angles, axes, cx, cy, maxValue, radius, series]);

  const labels = useMemo(() => {
    return axes.map((axis, idx) => buildRadarLabel(axis, angles[idx] ?? 0, cx, cy, radius));
  }, [angles, axes, cx, cy, radius]);

  return {
    axisLines,
    gridPolygons,
    labels,
    seriesPaths,
  };
}

function buildRadarLabel<K extends string>(
  axis: RadarAxis<K>,
  angle: number,
  cx: number,
  cy: number,
  radius: number,
): RadarLabel<K> {
  const point = polarPoint(cx, cy, radius + 16, angle);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    key: axis.key,
    text: axis.label,
    x: point.x,
    y: point.y,
    anchor: getTextAnchor(cos),
    baseline: getDominantBaseline(sin),
  };
}

function getTextAnchor(cos: number): RadarLabel<string>["anchor"] {
  if (Math.abs(cos) < 0.25) return "middle";
  return cos > 0 ? "start" : "end";
}

function getDominantBaseline(sin: number): RadarLabel<string>["baseline"] {
  if (Math.abs(sin) < 0.25) return "middle";
  return sin > 0 ? "hanging" : "alphabetic";
}
