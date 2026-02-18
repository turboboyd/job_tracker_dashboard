import { Button } from "src/shared/ui";

import { LEGEND_COLOR, SERIES } from "./trends.constants";
import type { SeriesKey, VisibleMap } from "./trends.types";

const LABELS: Record<SeriesKey, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export function TrendsLegend({
  visible,
  hoverKey,
  onToggle,
  onHover,
}: {
  visible: VisibleMap;
  hoverKey: SeriesKey | null;
  onToggle: (key: SeriesKey) => void;
  onHover: (key: SeriesKey | null) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {SERIES.map((key) => (
        <Button
          key={key}
          variant={visible[key] ? "outline" : "ghost"}
          size="sm"
          shape="pill"
          shadow="none"
          onMouseEnter={() => onHover(key)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onToggle(key)}
          className={[
            "h-8 gap-2 px-3 text-xs transition",
            visible[key]
              ? "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/60 hover:text-foreground",
            hoverKey === key ? "ring-1 ring-foreground/10" : "",
          ].join(" ")}
          aria-pressed={visible[key]}
        >
          <span
            className={[
              "h-2.5 w-2.5 rounded-full",
              visible[key] ? "opacity-100" : "opacity-40",
            ].join(" ")}
            style={{ backgroundColor: LEGEND_COLOR[key] }}
          />
          <span className="whitespace-nowrap">{LABELS[key]}</span>
        </Button>
      ))}
    </div>
  );
}
