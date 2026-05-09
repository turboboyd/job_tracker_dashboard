import { strokeColorFromClass, type DonutChartSegment } from './donutChart.helpers';
import type { DonutChartGeometry } from './useDonutChartModel';

interface DonutChartRingProps {
  activeKey: string | null;
  drawDuration: number;
  geometry: DonutChartGeometry;
  hasData: boolean;
  hitSlop: number;
  onActivate: (next: string | null) => void;
  segments: DonutChartSegment[];
  stroke: number;
}

export function DonutChartRing({
  activeKey,
  drawDuration,
  geometry,
  hasData,
  hitSlop,
  onActivate,
  segments,
  stroke,
}: DonutChartRingProps) {
  return (
    <svg
      width={geometry.outer}
      height={geometry.outer}
      viewBox={`0 0 ${geometry.outer} ${geometry.outer}`}
    >
      <defs>
        <filter id="donutGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx={geometry.cx}
        cy={geometry.cy}
        r={geometry.radius}
        fill="transparent"
        className="stroke-muted"
        strokeWidth={stroke}
        vectorEffect="non-scaling-stroke"
      />

      {hasData ? (
        segments.map((segment) => (
          <DonutChartSegmentArc
            key={`seg-${segment.label}`}
            activeKey={activeKey}
            drawDuration={drawDuration}
            geometry={geometry}
            hitSlop={hitSlop}
            onActivate={onActivate}
            segment={segment}
            stroke={stroke}
          />
        ))
      ) : (
        <circle
          cx={geometry.cx}
          cy={geometry.cy}
          r={geometry.radius}
          fill="transparent"
          className="stroke-border"
          strokeWidth={stroke}
          strokeDasharray="2 6"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

interface DonutChartSegmentArcProps {
  activeKey: string | null;
  drawDuration: number;
  geometry: DonutChartGeometry;
  hitSlop: number;
  onActivate: (next: string | null) => void;
  segment: DonutChartSegment;
  stroke: number;
}

function DonutChartSegmentArc({
  activeKey,
  drawDuration,
  geometry,
  hitSlop,
  onActivate,
  segment,
  stroke,
}: DonutChartSegmentArcProps) {
  const isActive = activeKey === segment.label;
  const segmentStroke = segment.color ?? strokeColorFromClass(segment.className);
  const segmentOpacity = !isActive && activeKey ? 0.62 : 1;

  return (
    <g>
      <circle
        cx={geometry.cx}
        cy={geometry.cy}
        r={geometry.radius}
        fill="transparent"
        stroke="transparent"
        strokeWidth={stroke + hitSlop}
        strokeLinecap="butt"
        strokeDasharray={segment.dasharray}
        strokeDashoffset={segment.dashoffset}
        vectorEffect="non-scaling-stroke"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        tabIndex={0}
        role="img"
        aria-label={`${segment.label}: ${segment.value}`}
        onMouseEnter={() => onActivate(segment.label)}
        onMouseLeave={() => onActivate(null)}
        onFocus={() => onActivate(segment.label)}
        onBlur={() => onActivate(null)}
      />

      <circle
        cx={geometry.cx}
        cy={geometry.cy}
        r={geometry.radius}
        fill="transparent"
        strokeLinecap="round"
        stroke={segmentStroke}
        strokeWidth={isActive ? stroke + 2 : stroke}
        strokeDasharray={segment.dasharray}
        strokeDashoffset={segment.dashoffset}
        vectorEffect="non-scaling-stroke"
        style={{
          pointerEvents: 'none',
          transformOrigin: '50% 50%',
          opacity: segmentOpacity,
          transform: isActive ? 'scale(1.012)' : 'scale(1)',
          filter: isActive ? 'url(#donutGlow)' : 'none',
          transition: [
            `stroke-dasharray ${drawDuration}s ease`,
            'opacity 150ms ease-out',
            'stroke-width 140ms ease-out',
            'transform 160ms ease',
          ].join(', '),
        }}
      />
    </g>
  );
}
