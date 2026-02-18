import { useTranslation } from "react-i18next";

import { LEGEND_COLOR, SERIES, toNumberSafe } from "./trends.constants";
import type { SeriesKey } from "./trends.types";

export function TrendsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string | number;
}) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  if (!active || !payload || payload.length === 0) return null;

  const title = typeof label === "string" ? label : String(label ?? "");

  const items = payload
    .filter((p) => SERIES.includes(p.dataKey as SeriesKey))
    .map((p) => {
      const key = p.dataKey as SeriesKey;
      return {
        key,
        label: String(t(`status.${key}`, { defaultValue: key })),
        value: toNumberSafe(p.value),
      };
    })
    .sort((a, b) => SERIES.indexOf(a.key) - SERIES.indexOf(b.key));

  return (
    <div className="min-w-[220px] rounded-xl border border-border bg-background/95 p-3 shadow-md backdrop-blur">
      <div className="text-xs font-semibold text-foreground">{title}</div>

      <div className="mt-2 space-y-2">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: LEGEND_COLOR[it.key] }}
              />
              <span className="text-muted-foreground">{it.label}</span>
            </div>
            <span className="font-semibold text-foreground">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
