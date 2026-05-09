import { getStatusMeta } from "./status.accessors";
import type {
  BoardColumnKey,
  Stage,
  StatusColor,
  StatusKey,
} from "./status.definitions";

export const STATUS_COLOR_CLASS: Record<StatusColor, string> = {
  neutral: "bg-muted text-foreground",
  info: "bg-blue-100 text-blue-900",
  warning: "bg-amber-100 text-amber-900",
  success: "bg-emerald-100 text-emerald-900",
  danger: "bg-red-100 text-red-900",
  purple: "bg-purple-100 text-purple-900",
};

export const STATUS_COLOR_DOT_CLASS: Record<StatusColor, string> = {
  neutral: "bg-status-neutral",
  info: "bg-status-info",
  warning: "bg-status-warning",
  success: "bg-status-success",
  danger: "bg-status-danger",
  purple: "bg-status-purple",
};

export const STATUS_COLOR_HEX: Record<StatusColor, string> = {
  neutral: "#64748b",
  info: "#2563eb",
  warning: "#d97706",
  success: "#059669",
  danger: "#dc2626",
  purple: "#7c3aed",
};

export const STAGE_COLOR: Record<Stage, StatusColor> = {
  ACTIVE: "info",
  INTERVIEW: "purple",
  OFFER: "warning",
  HIRED: "success",
  REJECTED: "danger",
  NO_RESPONSE: "neutral",
  ARCHIVED: "neutral",
};

export const BOARD_COLUMN_COLOR: Record<BoardColumnKey, StatusColor> = {
  ACTIVE: "info",
  INTERVIEW: "purple",
  OFFER: "warning",
  HIRED: "success",
  REJECTED: "danger",
  NO_RESPONSE: "neutral",
  ARCHIVED: "neutral",
};

export const BOARD_COLUMN_COLOR_HEX: Record<BoardColumnKey, string> = {
  ACTIVE: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.ACTIVE],
  INTERVIEW: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.INTERVIEW],
  OFFER: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.OFFER],
  HIRED: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.HIRED],
  REJECTED: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.REJECTED],
  NO_RESPONSE: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.NO_RESPONSE],
  ARCHIVED: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.ARCHIVED],
};

export function getStageColorForStatus(status: StatusKey): StatusColor {
  return STAGE_COLOR[getStatusMeta(status).stage];
}
