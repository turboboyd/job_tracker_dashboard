import React from "react";

import { SERIES, SERIES_LABELS, LEGEND_COLOR } from "./trends.constants";
import type { SeriesKey, VisibleMap } from "./trends.types";

export function TrendsLegend({
  visible,
  hoverKey,
  onToggle,
  onHover,
}: {
  visible: VisibleMap;
  hoverKey: SeriesKey | null;
  onToggle: (k: SeriesKey) => void;
  onHover: (k: SeriesKey | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {SERIES.map((k) => {
        const isOn = visible[k];
        const isHover = hoverKey === k;
        const color = LEGEND_COLOR[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onToggle(k)}
            onMouseEnter={() => onHover(k)}
            onMouseLeave={() => onHover(null)}
            className={
              "flex items-center gap-2 rounded-full border px-3 py-1 transition-colors " +
              (isOn ? "bg-transparent" : "bg-transparent text-foreground") +
              (isHover ? " ring-2 ring-ring" : "")
            }
            // Design: no filled background for the whole pill.
            // Active state is indicated by colored border + colored label + filled dot.
            style={
              isOn
                ? { borderColor: color, color }
                : { borderColor: "var(--border)" }
            }
          >
            <span
              className="inline-block h-2 w-2 rounded-full border"
              style={
                isOn
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: "transparent", borderColor: color }
              }
            />
            {SERIES_LABELS[k]}
          </button>
        );
      })}
    </div>
  );
}
