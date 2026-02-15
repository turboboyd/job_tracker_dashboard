import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getErrorMessage } from "src/shared/lib";
import { PageMessage } from "src/shared/ui";

import type { BoardMatchesQueryState } from "../model/types";

type Props = Readonly<{
  matchesQ: BoardMatchesQueryState;
  isEmpty: boolean;
  children: ReactNode;
}>;

export function BoardState({ matchesQ, isEmpty, children }: Props) {
  const { t } = useTranslation();

  if (matchesQ.isLoading) {
    return <PageMessage>{t("board.loading", "Loading matches…")}</PageMessage>;
  }

  if (matchesQ.isError) {
    return <PageMessage>{getErrorMessage(matchesQ.error)}</PageMessage>;
  }

  if (isEmpty) {
    return <PageMessage>{t("board.empty", "No matches yet.")}</PageMessage>;
  }

  return <>{children}</>;
}
