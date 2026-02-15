import type { LoopMatch, LoopMatchStatus } from "src/entities/loopMatch";

export const BOARD_DND_MIME = "application/x-match";

export type BoardDragPayload = Readonly<{
  matchId: string;
  fromStatus: LoopMatchStatus;
  fromIndex: number;
}>;

export type BoardOrderByStatus = Record<LoopMatchStatus, string[]>;


export type BoardMatchesQueryState = Readonly<{
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
}>;

export interface BoardVM {
  busy: boolean;

  queries: {
    matchesQ: BoardMatchesQueryState;
  };

  data: {
    matches: readonly LoopMatch[];
    byStatus: ReadonlyMap<LoopMatchStatus, readonly LoopMatch[]>;
    loopIdToName: ReadonlyMap<string, string>;
  };

  actions: {
    onDelete: (matchId: string) => void;
    onDropToStatus: (
      payload: BoardDragPayload,
      toStatus: LoopMatchStatus,
      toIndex: number
    ) => Promise<void>;
  };
}
