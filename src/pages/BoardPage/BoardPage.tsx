import { useTranslation } from "react-i18next";

import { useBoardController } from "./model/useBoardController";
import { BoardColumns } from "./ui/BoardColumns";
import { BoardPageHeader } from "./ui/BoardPageHeader";
import { BoardState } from "./ui/BoardState";
import { buildBoardColumnSummaries } from "./ui/boardStats.helpers";
import { BoardStatsBar } from "./ui/BoardStatsBar";

export default function BoardPage() {
  const vm = useBoardController();
  const { t } = useTranslation();

  const matchesQ = vm.queries.matchesQ;
  const isEmpty = vm.data.items.length === 0;
  const total = vm.data.items.length;

  const columns = buildBoardColumnSummaries(
    vm.data.byStatus,
    (key, fallback) => t(key, { defaultValue: fallback }),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background">
        <BoardPageHeader />
        <BoardStatsBar total={total} columns={columns} />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <BoardState matchesQ={matchesQ} isEmpty={isEmpty}>
          <BoardColumns vm={vm} />
        </BoardState>
      </div>
    </div>
  );
}
