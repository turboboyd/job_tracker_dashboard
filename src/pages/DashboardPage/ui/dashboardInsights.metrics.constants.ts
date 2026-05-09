import {
  BOARD_COLUMN_KEYS,
  type BoardColumnKey,
} from "src/entities/application";

export const NEEDS_ATTENTION_COLUMNS = [
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
] satisfies BoardColumnKey[];

export const STALE_DAYS_THRESHOLD = 14;

export const PIPELINE_COLUMNS: readonly BoardColumnKey[] =
  BOARD_COLUMN_KEYS.filter((column) => column !== "ARCHIVED");

