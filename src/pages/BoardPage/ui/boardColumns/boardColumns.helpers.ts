import type { TFunction } from 'i18next';

import { BOARD_COLUMNS_LIST, type BoardColumnKey } from 'src/entities/application';

import { APPLICATION_BOARD_COLUMNS } from '../../model/boardStatusMap';

export type BoardStatusView = Readonly<{
  status: BoardColumnKey;
  title: string;
}>;

const APP_COLUMN_SET = new Set<BoardColumnKey>(APPLICATION_BOARD_COLUMNS);

export function buildBoardStatuses(t: TFunction): BoardStatusView[] {
  return BOARD_COLUMNS_LIST
    .filter((column) => APP_COLUMN_SET.has(column.key))
    .map((column) => ({
      status: column.key,
      title: t(column.labelKey, { defaultValue: column.key }),
    }));
}
