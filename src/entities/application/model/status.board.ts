import {
  BOARD_COLUMN_KEYS,
  type BoardColumnKey,
  type StatusKey,
} from "./status.definitions";
import {
  ALL_STATUSES,
  STATUS,
  STATUS_KEYS,
} from "./status.registry";

export interface BoardColumnMeta {
  key: BoardColumnKey;
  labelKey: string;
  order: number;
}

export const BOARD_COLUMNS: Record<BoardColumnKey, BoardColumnMeta> = {
  ACTIVE: { key: "ACTIVE", labelKey: "board.column.ACTIVE", order: 1 },
  INTERVIEW: { key: "INTERVIEW", labelKey: "board.column.INTERVIEW", order: 2 },
  OFFER: { key: "OFFER", labelKey: "board.column.OFFER", order: 3 },
  HIRED: { key: "HIRED", labelKey: "board.column.HIRED", order: 4 },
  REJECTED: { key: "REJECTED", labelKey: "board.column.REJECTED", order: 5 },
  NO_RESPONSE: { key: "NO_RESPONSE", labelKey: "board.column.NO_RESPONSE", order: 6 },
  ARCHIVED: { key: "ARCHIVED", labelKey: "board.column.ARCHIVED", order: 7 },
};

export const BOARD_COLUMNS_LIST: readonly BoardColumnMeta[] = BOARD_COLUMN_KEYS
  .map((key) => BOARD_COLUMNS[key])
  .sort((left, right) => left.order - right.order);

export function getBoardColumn(status: StatusKey): BoardColumnKey {
  const meta = STATUS[status];
  return meta?.boardColumn ?? "ACTIVE";
}

export function defaultStatusForBoardColumn(column: BoardColumnKey): StatusKey {
  const first = ALL_STATUSES.filter((status) => status.boardColumn === column).sort(
    (left, right) => left.order - right.order,
  )[0];

  return first?.key ?? "SAVED";
}

export function getRepresentativeStatusForColumn(
  column: BoardColumnKey,
): StatusKey {
  const found = STATUS_KEYS.map((key) => STATUS[key])
    .filter((meta) => meta.boardColumn === column)
    .sort((left, right) => left.order - right.order)[0];

  return found?.key ?? STATUS_KEYS[0]!;
}

