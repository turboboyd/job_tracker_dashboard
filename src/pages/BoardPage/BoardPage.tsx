import { useTranslation } from "react-i18next";

import { PageHeader } from "src/shared/ui";

import { useBoardController } from "./model/useBoardController";
import { BoardColumns } from "./ui/BoardColumns";
import { BoardState } from "./ui/BoardState";

export default function BoardPage() {
  const vm = useBoardController();
  const { t } = useTranslation();

  const matchesQ = vm.queries.matchesQ;
  const isEmpty = vm.data.matches.length === 0;

  const title = t("board.title", "Board");
  const subtitle = t("board.subtitle", "Drag matches between columns to update status.");

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="flex-1 min-h-0 overflow-hidden">
        <BoardState matchesQ={matchesQ} isEmpty={isEmpty}>
          <BoardColumns vm={vm} />
        </BoardState>
      </div>
    </div>
  );
}
