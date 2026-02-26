import type { TFunction } from "i18next";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  BOARD_COLUMN_KEYS,
  BOARD_COLUMNS_LIST,
  type BoardColumnKey,
  BOARD_COLUMN_COLOR_HEX,
  getBoardColumn,
  normalizeStatusKey,
} from "src/entities/application/model/status";
import { Card, RadarChart, type RadarAxis, type RadarSeries } from "src/shared/ui";

type MatchLike = {
  status: string;
};

const PIPELINE_COLS: BoardColumnKey[] = BOARD_COLUMN_KEYS.filter((c) => c !== "ARCHIVED");

function colLabel(t: TFunction, col: BoardColumnKey): string {
  const meta = BOARD_COLUMNS_LIST.find((c) => c.key === col);
  return t(meta?.labelKey ?? `board.column.${col}`, { defaultValue: col });
}

export function DashboardStatusRadarCard({ matches }: { matches: MatchLike[] }) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const axes = useMemo<RadarAxis<BoardColumnKey>[]>(() => {
    return PIPELINE_COLS.map((col) => ({
      key: col,
      label: colLabel(t, col),
    }));
  }, [t]);

  const series = useMemo<RadarSeries<BoardColumnKey>[]>(() => {
    const counts = {} as Record<BoardColumnKey, number>;
    for (const c of PIPELINE_COLS) counts[c] = 0;

    // Matches may store either a StatusKey (preferred) or legacy values.
    // Convert to StatusKey -> BoardColumnKey so radar always works.
    for (const m of matches) {
      const key = normalizeStatusKey(m.status);
      if (!key) continue;
      const col = getBoardColumn(key);
      if ((PIPELINE_COLS as readonly string[]).includes(col)) counts[col] += 1;
    }

    const total = PIPELINE_COLS.reduce((acc, c) => acc + (counts[c] ?? 0), 0);
    const values = {} as Record<BoardColumnKey, number>;
    for (const c of PIPELINE_COLS) values[c] = total ? (counts[c] ?? 0) / total : 0;

    return [
      {
        key: "mix",
        label: t("radar.mix", "Mix"),
        color: "#2563EB",
        values,
      },
    ];
  }, [matches, t]);

  const percents = useMemo(() => {
    const s = series[0];
    const values = (s?.values ?? {}) as Record<BoardColumnKey, number>;
    return PIPELINE_COLS.map((col) => ({ col, value: values[col] ?? 0 }));
  }, [series]);

  return (
    <Card className="p-6">
      <div className="text-sm font-semibold text-foreground">
        {t("radar.title", "Pipeline mix")}
      </div>
      <div className="text-xs text-muted-foreground">
        {t("radar.subtitle", "Share by stage")}
      </div>

      <div className="mt-5 flex items-center justify-center">
        <RadarChart size={240} axes={axes} series={series} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {percents.map(({ col, value }) => {
          const color = BOARD_COLUMN_COLOR_HEX[col];
          const label = colLabel(t, col);
          return (
            <div key={col} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground">{label}</span>
              </div>
              <div className="tabular-nums text-foreground">{Math.round(value * 100)}%</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
