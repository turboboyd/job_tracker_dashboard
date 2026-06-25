import type { BoardColumnKey, StatusKey } from "src/entities/application";

export const BOARD_DND_MIME = "application/x-match";

export type BoardDragPayload = Readonly<{
  /** Board card (application) id being dragged. */
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

/**
 * Flat view-model for a single Application rendered on the board.
 *
 * The board reads from the SAME Applications source as `/dashboard/applications`
 * (REST `/applications`). Field names `id` / `status` / `loopId` are kept so the
 * generic grouping / ordering / drag-and-drop plumbing works unchanged.
 */
export interface BoardCardItem {
  /** Application id. */
  id: string;
  /** Normalized status key — drives column grouping via getBoardColumn(). */
  status: StatusKey;
  /** Linked loop id ("" when none) — optional metadata only. */
  loopId: string;
  roleTitle: string;
  companyName: string;
  location: string;
  matchScore: number | null;
  createdAtMs: number | null;
  isFavorite: boolean;
}

export interface BoardVM {
  busy: boolean;

  queries: {
    matchesQ: BoardMatchesQueryState;
  };

  data: {
    items: readonly BoardCardItem[];
    byStatus: ReadonlyMap<BoardColumnKey, readonly BoardCardItem[]>;
    loopIdToName: ReadonlyMap<string, string>;
  };

  actions: {
    onDelete: (itemId: string) => void;
    onDropToStatus: (
      payload: BoardDragPayload,
      toStatus: BoardColumnKey,
      toIndex: number
    ) => Promise<void>;
  };
}
