import {
  BOARD_COLUMN_COLOR_HEX,
  BOARD_COLUMN_KEYS,
  BOARD_COLUMNS_LIST,
  getBoardColumn,
  normalizeStatusKey,
  type BoardColumnKey,
} from "src/entities/application";
import type { RadarAxis, RadarSeries } from "src/shared/ui";

export interface DashboardStatusRadarMatch {
  status?: unknown;
}

export interface DashboardStatusRadarPercent {
  color: string;
  column: BoardColumnKey;
  label: string;
  value: number;
}

type DashboardStatusRadarTranslator = (key: string, fallback: string) => string;

const RADAR_MIX_COLOR = "#2563EB";

const PIPELINE_COLUMNS: readonly BoardColumnKey[] = BOARD_COLUMN_KEYS.filter(
  (column) => column !== "ARCHIVED",
);

export function buildDashboardStatusRadarAxes(
  translate: DashboardStatusRadarTranslator,
): RadarAxis<BoardColumnKey>[] {
  return PIPELINE_COLUMNS.map((column) => ({
    key: column,
    label: getColumnLabel(column, translate),
  }));
}

export function buildDashboardStatusRadarValues(
  matches: DashboardStatusRadarMatch[],
): Record<BoardColumnKey, number> {
  const counts = createEmptyPipelineCounts();

  for (const match of matches) {
    incrementPipelineCount(counts, match.status);
  }

  return normalizePipelineCounts(counts);
}

export function buildDashboardStatusRadarSeries(
  values: Record<BoardColumnKey, number>,
  label: string,
): RadarSeries<BoardColumnKey>[] {
  return [
    {
      color: RADAR_MIX_COLOR,
      key: "mix",
      label,
      values,
    },
  ];
}

export function buildDashboardStatusRadarPercents(
  values: Record<BoardColumnKey, number>,
  translate: DashboardStatusRadarTranslator,
): DashboardStatusRadarPercent[] {
  return PIPELINE_COLUMNS.map((column) => ({
    color: BOARD_COLUMN_COLOR_HEX[column],
    column,
    label: getColumnLabel(column, translate),
    value: values[column] ?? 0,
  }));
}

function createEmptyPipelineCounts(): Record<BoardColumnKey, number> {
  return Object.fromEntries(PIPELINE_COLUMNS.map((column) => [column, 0])) as Record<
    BoardColumnKey,
    number
  >;
}

function incrementPipelineCount(
  counts: Record<BoardColumnKey, number>,
  status: unknown,
): void {
  const statusKey = normalizeStatusKey(status);
  if (!statusKey) return;

  const column = getBoardColumn(statusKey);
  if (!PIPELINE_COLUMNS.includes(column)) return;

  counts[column] += 1;
}

function normalizePipelineCounts(
  counts: Record<BoardColumnKey, number>,
): Record<BoardColumnKey, number> {
  const total = PIPELINE_COLUMNS.reduce((sum, column) => sum + (counts[column] ?? 0), 0);
  const values = createEmptyPipelineCounts();

  for (const column of PIPELINE_COLUMNS) {
    values[column] = total > 0 ? (counts[column] ?? 0) / total : 0;
  }

  return values;
}

function getColumnLabel(
  column: BoardColumnKey,
  translate: DashboardStatusRadarTranslator,
): string {
  const meta = BOARD_COLUMNS_LIST.find((candidate) => candidate.key === column);

  return translate(meta?.labelKey ?? `board.column.${column}`, column);
}
