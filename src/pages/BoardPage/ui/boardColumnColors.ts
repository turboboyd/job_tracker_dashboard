import type { BoardColumnKey } from "src/entities/application/model/status";

/**
 * Accent color per board column.
 *
 * Routed through the app's canonical, theme-aware status palette
 * (`--status-*`, documented in tailwind.config.cjs as the column/stage mapping),
 * which matches the Loopboard Redesign board colors — blue ACTIVE, purple
 * INTERVIEW, amber OFFER, green HIRED, red REJECTED, neutral NO_RESPONSE.
 * Kept in one place so the stats-bar legend and the columns never drift apart.
 */
export const BOARD_COLUMN_COLORS: Readonly<Record<string, string>> = {
  ACTIVE:      "rgb(var(--status-info))",
  INTERVIEW:   "rgb(var(--status-purple))",
  OFFER:       "rgb(var(--status-warning))",
  HIRED:       "rgb(var(--status-success))",
  REJECTED:    "rgb(var(--status-danger))",
  NO_RESPONSE: "rgb(var(--status-neutral))",
};

export const BOARD_COLUMN_FALLBACK_COLOR = "rgb(var(--status-neutral))";

export function getBoardColumnColor(status: BoardColumnKey | string): string {
  return BOARD_COLUMN_COLORS[status] ?? BOARD_COLUMN_FALLBACK_COLOR;
}
