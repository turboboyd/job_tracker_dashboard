import { LEGEND_COLOR, SERIES, SERIES_LABELS } from "./trends.constants";
import type { ModeKey, TrendsPoint, VisibleMap } from "./trends.types";

interface TrendsChartTooltipProps {
  mode: ModeKey;
  point: TrendsPoint;
  visible: VisibleMap;
  xPercent: number;
}

export function TrendsChartTooltip({
  mode,
  point,
  visible,
  xPercent,
}: TrendsChartTooltipProps) {
  const alignRight = xPercent > 68;

  return (
    <div
      className="pointer-events-none absolute top-3 min-w-[150px] rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
      style={{
        left: `${xPercent}%`,
        transform: alignRight ? "translateX(-100%)" : "translateX(8px)",
      }}
    >
      <div className="mb-1 font-medium">
        {point.date} - {mode}
      </div>
      <div className="space-y-1">
        {SERIES.map((key) => {
          if (!visible[key]) return null;

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: LEGEND_COLOR[key] }}
                />
                {SERIES_LABELS[key]}
              </span>
              <span className="font-medium">{point[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
