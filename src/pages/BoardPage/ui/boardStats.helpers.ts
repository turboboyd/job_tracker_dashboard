import {
  BOARD_COLUMNS_LIST,
  type BoardColumnKey,
} from "src/entities/application/model/status";

import { APPLICATION_BOARD_COLUMNS } from "../model/boardStatusMap";
import type { BoardCardItem } from "../model/types";

import { getBoardColumnColor } from "./boardColumnColors";

export type BoardColumnSummary = Readonly<{
  key: BoardColumnKey;
  label: string;
  count: number;
  color: string;
}>;

type Translate = (key: string, fallback: string) => string;

const APP_COLUMN_SET = new Set<BoardColumnKey>(APPLICATION_BOARD_COLUMNS);
const APP_BOARD_COLUMN_METAS = BOARD_COLUMNS_LIST.filter((column) =>
  APP_COLUMN_SET.has(column.key),
);

/**
 * Build the per-column legend shown in the board stats bar. Columns, keys and
 * order come from {@link APPLICATION_BOARD_COLUMNS} so the legend always matches
 * the rendered board.
 */
export function buildBoardColumnSummaries(
  byStatus: ReadonlyMap<BoardColumnKey, readonly BoardCardItem[]>,
  translate: Translate,
): BoardColumnSummary[] {
  return APP_BOARD_COLUMN_METAS.map((col) => ({
    key: col.key,
    label: translate(col.labelKey, col.key),
    count: byStatus.get(col.key)?.length ?? 0,
    color: getBoardColumnColor(col.key),
  }));
}
