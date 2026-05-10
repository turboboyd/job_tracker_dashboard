import {
  BOARD_COLUMN_COLOR_HEX,
  BOARD_COLUMN_KEYS,
  BOARD_COLUMNS_LIST,
  type BoardColumnKey,
} from "src/entities/application";

export interface DashboardPipelineSummary {
  byColumn: Record<BoardColumnKey, number>;
  total: number;
}

export interface DashboardPipelineSlice {
  className: string;
  color: string;
  label: string;
  value: number;
}

type DashboardPipelineTranslator = (key: string, fallback: string) => string;

const PIPELINE_COLUMNS: readonly BoardColumnKey[] = BOARD_COLUMN_KEYS.filter(
  (column) => column !== "ARCHIVED",
);

export function buildDashboardPipelineSlices(
  summary: DashboardPipelineSummary,
  translate: DashboardPipelineTranslator,
): DashboardPipelineSlice[] {
  return PIPELINE_COLUMNS.map((column) => ({
    className: "",
    color: BOARD_COLUMN_COLOR_HEX[column],
    label: getPipelineColumnLabel(column, translate),
    value: summary.byColumn[column] ?? 0,
  }));
}

function getPipelineColumnLabel(
  column: BoardColumnKey,
  translate: DashboardPipelineTranslator,
): string {
  const meta = BOARD_COLUMNS_LIST.find((candidate) => candidate.key === column);

  return translate(meta?.labelKey ?? `board.column.${column}`, column);
}
