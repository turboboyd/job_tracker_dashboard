import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BOARD_COLUMNS_LIST } from "src/entities/application/model/status";

import { useBoardController } from "./model/useBoardController";
import { BoardColumns } from "./ui/BoardColumns";
import { BoardState } from "./ui/BoardState";

const COLUMN_COLORS: Record<string, string> = {
  ACTIVE:      "rgb(var(--status-info))",
  INTERVIEW:   "rgb(var(--status-purple))",
  OFFER:       "rgb(var(--status-warning))",
  HIRED:       "rgb(var(--status-success))",
  REJECTED:    "rgb(var(--status-danger))",
  NO_RESPONSE: "rgb(var(--status-neutral))",
};

export default function BoardPage() {
  const vm = useBoardController();
  const { t } = useTranslation();

  const matchesQ = vm.queries.matchesQ;
  const isEmpty = vm.data.matches.length === 0;
  const total = vm.data.matches.length;

  const columnCounts = BOARD_COLUMNS_LIST.map((col) => ({
    key: col.key,
    label: t(col.labelKey, { defaultValue: col.key }),
    count: vm.data.byStatus.get(col.key)?.length ?? 0,
    color: COLUMN_COLORS[col.key] ?? "rgb(var(--status-neutral))",
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-7 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
                <span>Loopboard</span>
                <span>/</span>
                <span className="text-muted-foreground">{t("board.title", "Board")}</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
                {t("board.title", "Board")}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-subtle-foreground" />
                {t("board.allLoops", "All loops")}
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Search className="h-3.5 w-3.5 text-subtle-foreground" />
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("board.newApplication", "New application")}
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-7 py-2.5 border-t border-border flex-wrap">
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <span className="text-subtle-foreground">{t("board.total", "Total on board")}:</span>
            <span className="font-semibold tabular-nums">{total}</span>
          </div>
          <div className="h-3.5 w-px bg-border" />
          <div className="flex items-center gap-3.5 flex-wrap">
            {columnCounts.map((col) => (
              <span key={col.key} className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-[2px] shrink-0"
                  style={{ background: col.color }}
                />
                {col.label}
                <span className="font-medium tabular-nums text-foreground">{col.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <BoardState matchesQ={matchesQ} isEmpty={isEmpty}>
          <BoardColumns vm={vm} />
        </BoardState>
      </div>
    </div>
  );
}
