import type { RadarPoint } from "./RadarChart.types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function polarPoint(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): RadarPoint {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

export function pointsToPath(points: RadarPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  if (!first) return "";
  const parts = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];
  for (const point of rest) {
    parts.push(`L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}
