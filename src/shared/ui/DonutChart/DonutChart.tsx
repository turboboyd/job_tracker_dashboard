import { type DonutChartSlice as Slice } from './donutChart.helpers';
import { DonutChartRing } from './donutChart.ring';
import {
  DonutChartCenterOverlay,
  DonutChartLegend,
} from './donutChart.sections';
import { useDonutChartModel } from './useDonutChartModel';

interface Props {
  title?: string;
  totalLabel?: string;
  centerTop: string;
  centerBottom: string;
  slices: Slice[];
  size?: number;
  stroke?: number;
  animateOnMount?: boolean;
  drawDuration?: number;
  stagger?: number;
  gapPx?: number;
  hitSlop?: number;
  padPx?: number;
  zOrderBySlices?: boolean;
}

export function DonutChart({
  title = 'Applications',
  totalLabel = 'Total',
  centerTop,
  centerBottom,
  slices,
  size = 180,
  stroke = 14,
  drawDuration = 0.9,
  gapPx = 6,
  hitSlop = 10,
  padPx,
  zOrderBySlices = true,
}: Props) {
  const {
    active,
    activeKey,
    centerTopMaybeNumber,
    geometry,
    hasData,
    segmentsForRender,
    setActiveKey,
    total,
  } = useDonutChartModel({
    centerTop,
    gapPx,
    hitSlop,
    padPx,
    size,
    slices,
    stroke,
    zOrderBySlices,
  });

  return (
    <div className="w-full">
      <div className="text-sm font-semibold text-foreground leading-tight">{title}</div>

      <div className="mt-lg flex flex-col items-stretch gap-lg 2xl:flex-row 2xl:items-center">
        <div
          className="relative shrink-0"
          style={{ width: geometry.outer, height: geometry.outer }}
        >
          <DonutChartRing
            activeKey={activeKey}
            drawDuration={drawDuration}
            geometry={geometry}
            hasData={hasData}
            hitSlop={hitSlop}
            onActivate={setActiveKey}
            segments={segmentsForRender}
            stroke={stroke}
          />

          <DonutChartCenterOverlay
            centerTop={centerTop}
            centerBottom={centerBottom}
            centerTopMaybeNumber={centerTopMaybeNumber}
            active={active}
          />
        </div>

        <DonutChartLegend
          slices={slices}
          active={active}
          totalLabel={totalLabel}
          total={total}
          onActivate={setActiveKey}
        />
      </div>
    </div>
  );
}
