import { BOARD_DND_MIME } from "./types";
import type { BoardDragPayload } from "./types";

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBoardDragPayload(value: unknown): value is BoardDragPayload {
  if (!isObject(value)) return false;

  const matchId = value["matchId"];
  const fromStatus = value["fromStatus"];
  const fromIndex = value["fromIndex"];

  return (
    typeof matchId === "string" &&
    typeof fromStatus === "string" &&
    typeof fromIndex === "number"
  );
}

/** Put payload into DataTransfer using a stable MIME key. */
export function setDragPayload(dt: DataTransfer, payload: BoardDragPayload): void {
  const raw = JSON.stringify(payload);
  dt.setData(BOARD_DND_MIME, raw);
  dt.setData("text/plain", raw);
  dt.effectAllowed = "move";
}

/** Read payload from DataTransfer and validate it. */
export function getDragPayload(dt: DataTransfer): BoardDragPayload | null {
  const raw = dt.getData(BOARD_DND_MIME) || dt.getData("text/plain");
  if (!raw) return null;

  const parsed = safeJsonParse(raw);
  return isBoardDragPayload(parsed) ? parsed : null;
}
