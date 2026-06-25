import { useTranslation } from "react-i18next";

import type { BoardColumnSummary } from "./boardStats.helpers";

type Props = Readonly<{
  total: number;
  columns: readonly BoardColumnSummary[];
}>;

/**
 * Presentational stats bar: total count on the board plus a per-column legend.
 * Pure — all values arrive via props (see {@link buildBoardColumnSummaries}).
 */
export function BoardStatsBar({ total, columns }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 px-7 py-2.5 border-t border-border flex-wrap">
      <div className="flex items-center gap-1.5 text-[12.5px]">
        <span className="text-subtle-foreground">{t("board.total", "Всего на доске")}:</span>
        <span className="font-semibold tabular-nums">{total}</span>
      </div>
      <div className="h-3.5 w-px bg-border" />
      <div className="flex items-center gap-4 flex-wrap">
        {columns.map((col) => (
          <span
            key={col.key}
            className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground"
          >
            <span
              className="h-2 w-2 rounded-[2px] shrink-0"
              style={{ background: col.color }}
            />
            {col.label}
            {" · "}
            <span className="font-semibold tabular-nums text-foreground">{col.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
