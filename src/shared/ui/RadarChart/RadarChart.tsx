import { pointsToPath } from "./RadarChart.geometry";
import type { RadarChartProps, RadarAxis, RadarSeries } from "./RadarChart.types";
import { useRadarChartModel } from "./useRadarChartModel";

export type { RadarAxis, RadarSeries };

export function RadarChart<K extends string>({
  axes,
  series,
  size = 260,
  maxValue = 1,
  levels = 4,
}: RadarChartProps<K>) {
  const { axisLines, gridPolygons, labels, seriesPaths } = useRadarChartModel({
    axes,
    levels,
    maxValue,
    series,
    size,
  });

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
        {axisLines.map((line, i) => (
          <line
            key={`axis-${i}`}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}
      </g>

      <g>
        {seriesPaths.map((path) => (
          <path
            key={path.key}
            d={path.d}
            fill={path.color}
            fillOpacity={0.14}
            stroke={path.color}
            strokeOpacity={0.9}
            strokeWidth={2}
          />
        ))}
      </g>

      <g>
        {labels.map((label) => (
          <text
            key={String(label.key)}
            x={label.x}
            y={label.y}
            fontSize={11}
            fill="currentColor"
            fillOpacity={0.75}
            textAnchor={label.anchor}
            dominantBaseline={label.baseline}
          >
            {label.text}
          </text>
        ))}
      </g>
    </svg>
  );
}
