import {
  strokeColorFromClass,
  withAlpha,
  type DonutChartSegment,
  type DonutChartSlice,
} from './donutChart.helpers';

interface CenterOverlayProps {
  centerTop: string;
  centerBottom: string;
  centerTopMaybeNumber: number | null;
  active: DonutChartSegment | null;
}

export function DonutChartCenterOverlay({
  centerTop,
  centerBottom,
  centerTopMaybeNumber,
  active,
}: CenterOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="text-center">
        <div className="text-2xl font-semibold text-foreground leading-none">
          {centerTopMaybeNumber == null ? (
            centerTop
          ) : (
            <AnimatedNumber value={centerTopMaybeNumber} />
          )}
        </div>

        <div className="mt-1 text-xs text-muted-foreground leading-normal">{centerBottom}</div>

        {active ? <ActiveSegmentCard active={active} /> : null}
      </div>
    </div>
  );
}

interface ActiveSegmentCardProps {
  active: DonutChartSegment;
}

function ActiveSegmentCard({ active }: ActiveSegmentCardProps) {
  return (
    <div
      className="mt-md inline-flex max-w-[160px] flex-col rounded-lg border border-border bg-background/70 px-sm py-[6px] text-[11px] text-foreground shadow-sm backdrop-blur"
    >
      <div className="flex items-center justify-center gap-sm">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: active.color ?? strokeColorFromClass(active.className),
          }}
        />
        <span className="truncate font-medium">{active.label}</span>
      </div>
      <div className="mt-0.5 text-center text-muted-foreground">
        {active.value} - {Math.round(active.frac * 100)}%
      </div>
    </div>
  );
}

interface LegendProps {
  slices: DonutChartSlice[];
  active: DonutChartSegment | null;
  totalLabel: string;
  total: number;
  onActivate: (next: string | null) => void;
}

export function DonutChartLegend({
  slices,
  active,
  totalLabel,
  total,
  onActivate,
}: LegendProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="grid grid-cols-2 gap-2 2xl:flex 2xl:flex-col 2xl:gap-2">
        {slices.map((slice) => {
          const isLegendActive = active?.label === slice.label && slice.value > 0;
          const dotColor = slice.color ?? strokeColorFromClass(slice.className);
          const activeStyle =
            isLegendActive && dotColor && dotColor !== 'currentColor'
              ? { backgroundColor: withAlpha(dotColor, 0.1) }
              : undefined;

          return (
            <div
              key={slice.label}
              className={[
                'flex items-center justify-between gap-sm rounded-md px-sm py-1',
                'transition-colors duration-fast ease-ease-out',
                isLegendActive ? 'bg-muted/50' : '',
              ].join(' ')}
              style={activeStyle}
              onMouseEnter={() => onActivate(slice.value > 0 ? slice.label : null)}
              onMouseLeave={() => onActivate(null)}
            >
              <div className="flex min-w-0 items-center gap-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
                <span className="truncate text-sm text-foreground leading-normal">{slice.label}</span>
              </div>

              <span
                className="text-sm text-muted-foreground leading-normal"
              >
                {slice.value}
              </span>
            </div>
          );
        })}

        <div className="col-span-2 pt-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground leading-normal">{totalLabel}</span>
            <span className="text-xs text-muted-foreground leading-normal">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  return <span>{value}</span>;
}
