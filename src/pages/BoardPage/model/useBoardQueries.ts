import React from "react";

import type { Loop } from "src/entities/loop";
import { useGetAllMatchesQuery, type LoopMatch } from "src/entities/loopMatch";
import { useAuthSelectors } from "src/features/auth/model";
import { useBackendLoopsQuery } from "src/features/loops";

import type { BoardMatchesQueryState } from "./types";

export type BoardQueries = Readonly<{
  loops: readonly Loop[];
  matches: readonly LoopMatch[];
  matchesQ: BoardMatchesQueryState;
}>;


export function useBoardQueries(): BoardQueries {
  const { isAuthReady, isAuthenticated } = useAuthSelectors();
  const loopsQ = useBackendLoopsQuery({
    includeArchived: true,
    skip: !isAuthReady || !isAuthenticated,
  });
  const matchesQ = useGetAllMatchesQuery();

  const loops = React.useMemo(() => loopsQ.data ?? [], [loopsQ.data]);
  const matches = React.useMemo(() => matchesQ.data ?? [], [matchesQ.data]);

  const matchesQueryState: BoardMatchesQueryState = React.useMemo(
    () => ({
      isLoading: matchesQ.isLoading,
      isError: matchesQ.isError,
      error: matchesQ.error,
    }),
    [matchesQ.error, matchesQ.isError, matchesQ.isLoading],
  );

  return { loops, matches, matchesQ: matchesQueryState };
}
