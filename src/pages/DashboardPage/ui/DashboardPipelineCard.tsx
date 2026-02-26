import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  BOARD_COLUMN_KEYS,
  BOARD_COLUMNS_LIST,
  type BoardColumnKey,
  BOARD_COLUMN_COLOR_HEX,
} from "src/entities/application/model/status";
import { Card, DonutChart } from "src/shared/ui";

type Summary = {
  total: number;
  byColumn: Record<BoardColumnKey, number>;
};

const PIPELINE_COLS: BoardColumnKey[] = BOARD_COLUMN_KEYS.filter((c) => c !== "ARCHIVED");

function colLabel(t: TFunction, col: BoardColumnKey): string {
  const meta = BOARD_COLUMNS_LIST.find((c) => c.key === col);
  return t(meta?.labelKey ?? `board.column.${col}`, { defaultValue: col });
}

export function DashboardPipelineCard({
  summary,
  size,
  stroke,
}: {
  summary: Summary;
  size: number;
  stroke: number;
}) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const slices = React.useMemo(() => {
    return PIPELINE_COLS.map((col) => {
      return {
        label: colLabel(t, col),
        value: summary.byColumn[col] ?? 0,
        color: BOARD_COLUMN_COLOR_HEX[col],
        className: "",
      };
    });
  }, [summary.byColumn, t]);

  return (
    <Card className="p-6">
      <div className="text-sm font-semibold text-foreground">
        {t("pipeline.title", "Pipeline")}
      </div>
      <div className="text-xs text-muted-foreground">
        {t("pipeline.subtitle", "By stage")}
      </div>

      <div className="mt-5 flex items-center justify-center">
        <DonutChart
          size={size}
          stroke={stroke}
          slices={slices}
          centerTop={t("pipeline.total", "Total")}
          centerBottom={String(summary.total)}
        />
      </div>
    </Card>
  );
}
