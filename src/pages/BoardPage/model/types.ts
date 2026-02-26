import type { BoardColumnKey } from "src/entities/application/model/status";
import type { LoopMatch } from "src/entities/loopMatch";

export const BOARD_DND_MIME = "application/x-match";

export type BoardDragPayload = Readonly<{
  matchId: string;
  fromStatus: BoardColumnKey;
  fromIndex: number;
}>;

export type BoardOrderByStatus = Record<BoardColumnKey, string[]>;


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
    byStatus: ReadonlyMap<BoardColumnKey, readonly LoopMatch[]>;
    loopIdToName: ReadonlyMap<string, string>;
  };

  actions: {
    onDelete: (matchId: string) => void;
    onDropToStatus: (
      payload: BoardDragPayload,
      toStatus: BoardColumnKey,
      toIndex: number
    ) => Promise<void>;
  };
}
