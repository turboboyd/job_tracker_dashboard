import type { PointerEvent } from "react";
import { useMemo, useState } from "react";

import type {
  ModeKey,
  SeriesKey,
  TrendsPoint,
  VisibleMap,
} from "./trends.types";
import {
  CHART_HEIGHT,
  CHART_INNER_WIDTH,
  CHART_MARGIN,
  CHART_WIDTH,
  buildChartModel,
  getX,
} from "./TrendsChart.geometry";
import {
  TrendLines,
  TrendsHoverMarker,
  TrendsXAxisLabels,
  TrendsYAxisGrid,
} from "./TrendsChart.layers";
import { TrendsChartTooltip } from "./TrendsChartTooltip";

interface TrendsChartProps {
  points: TrendsPoint[];
  mode: ModeKey;
  visible: VisibleMap;
  hoverKey: SeriesKey | null;
}

export function TrendsChart({
  points,
  mode,
  visible,
  hoverKey,
}: TrendsChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const model = useMemo(
    () => buildChartModel(points, visible),
    [points, visible],
  );

  const hoverPoint =
    hoverIndex == null
      ? null
      : points[Math.min(hoverIndex, points.length - 1)] ?? null;
  const hoverX = hoverIndex == null ? null : getX(hoverIndex, points.length);

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (points.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const chartX = ratio * CHART_WIDTH;
    const clampedX = Math.max(
      CHART_MARGIN.left,
      Math.min(CHART_WIDTH - CHART_MARGIN.right, chartX),
    );
    const position = (clampedX - CHART_MARGIN.left) / CHART_INNER_WIDTH;
    const nextIndex = Math.round(position * Math.max(0, points.length - 1));

    setHoverIndex(Math.max(0, Math.min(points.length - 1, nextIndex)));
  }

  return (
    <div className="relative h-[260px] w-full">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label={`Applications trends by ${mode}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <g>
          <TrendsYAxisGrid yMax={model.yMax} yTicks={model.yTicks} />
          <TrendsXAxisLabels points={points} xTicks={model.xTicks} />
          <TrendLines hoverKey={hoverKey} lines={model.lines} />

          {hoverX != null && hoverPoint ? (
            <TrendsHoverMarker
              hoverIndex={hoverIndex ?? 0}
              hoverX={hoverX}
              lines={model.lines}
            />
          ) : null}
        </g>
      </svg>

      {hoverPoint ? (
        <TrendsChartTooltip
          mode={mode}
          point={hoverPoint}
          visible={visible}
          xPercent={hoverX == null ? 50 : (hoverX / CHART_WIDTH) * 100}
        />
      ) : null}
    </div>
  );
}
