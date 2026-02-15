import React from "react";

export type RadarAxis<K extends string> = { key: K; label: string };

export type RadarSeries<K extends string> = {
  key: string;
  label: string;
  color: string;
  values: Record<K, number>;
};

type Props<K extends string> = {
  axes: RadarAxis<K>[];
  series: RadarSeries<K>[];
  size?: number;
  maxValue?: number;
  levels?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function polarPoint(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function pointsToPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const parts = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];
  for (const p of rest) parts.push(`L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  parts.push("Z");
  return parts.join(" ");
}

type SvgTextAnchor = React.SVGProps<SVGTextElement>["textAnchor"];
type SvgDominantBaseline = React.SVGProps<SVGTextElement>["dominantBaseline"];

export function RadarChart<K extends string>({
  axes,
  series,
  size = 260,
  maxValue = 1,
  levels = 4,
}: Props<K>) {
  const n = axes.length;
  const pad = 34;
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(10, size / 2 - pad);

  const angles = React.useMemo(() => {
    if (n === 0) return [] as number[];
    const base = -Math.PI / 2;
    const step = (2 * Math.PI) / n;
    return Array.from({ length: n }, (_, i) => base + i * step);
  }, [n]);

  const gridPolygons = React.useMemo(() => {
    const lv = Math.max(1, levels);
    return Array.from({ length: lv }, (_, i) => {
      const k = (i + 1) / lv;
      return angles.map((a) => polarPoint(cx, cy, radius * k, a));
    });
  }, [angles, cx, cy, levels, radius]);

  const axisLines = React.useMemo(() => {
    return angles.map((a) => ({
      from: { x: cx, y: cy },
      to: polarPoint(cx, cy, radius, a),
    }));
  }, [angles, cx, cy, radius]);

  const seriesPaths = React.useMemo(() => {
    return series.map((s) => {
      const pts = axes.map((ax, idx) => {
        const raw = s.values[ax.key] ?? 0;
        const v = clamp(raw, 0, maxValue) / maxValue;
        return polarPoint(cx, cy, radius * v, angles[idx]);
      });
      return { key: s.key, color: s.color, d: pointsToPath(pts) };
    });
  }, [angles, axes, cx, cy, maxValue, radius, series]);

  const labels = React.useMemo(() => {
    return axes.map((ax, idx) => {
      const a = angles[idx];
      const p = polarPoint(cx, cy, radius + 16, a);

      const cos = Math.cos(a);
      const sin = Math.sin(a);

      let anchor: SvgTextAnchor = "middle";
      if (Math.abs(cos) >= 0.25) {
        anchor = cos > 0 ? "start" : "end";
      }

      let baseline: SvgDominantBaseline = "middle";
      if (Math.abs(sin) >= 0.25) {
        baseline = sin > 0 ? "hanging" : "alphabetic";
      }

      return {
        key: ax.key,
        text: ax.label,
        x: p.x,
        y: p.y,
        anchor,
        baseline,
      };
    });
  }, [angles, axes, cx, cy, radius]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g>
        {gridPolygons.map((poly, i) => (
          <path
            key={`grid-${i}`}
            d={pointsToPath(poly)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}
        {axisLines.map((l, i) => (
          <line
            key={`axis-${i}`}
            x1={l.from.x}
            y1={l.from.y}
            x2={l.to.x}
            y2={l.to.y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}
      </g>

      <g>
        {seriesPaths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill={p.color}
            fillOpacity={0.14}
            stroke={p.color}
            strokeOpacity={0.9}
            strokeWidth={2}
          />
        ))}
      </g>

      <g>
        {labels.map((l) => (
          <text
            key={String(l.key)}
            x={l.x}
            y={l.y}
            fontSize={11}
            fill="currentColor"
            fillOpacity={0.75}
            textAnchor={l.anchor}
            dominantBaseline={l.baseline}
          >
            {l.text}
          </text>
        ))}
      </g>
    </svg>
  );
}
