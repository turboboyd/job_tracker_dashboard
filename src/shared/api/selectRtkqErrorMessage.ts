import type { SerializedError } from "@reduxjs/toolkit";

import type { ApiError } from "./rtk/rtkError";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizeMessage(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const msg = v.trim();
  return msg.length > 0 ? msg : null;
}

function pickMessageFromRecord(record: Record<string, unknown>): string | null {
  const direct = normalizeMessage(record["message"]);
  if (direct) return direct;

  const data = record["data"];
  if (isRecord(data)) {
    const dataMsg = normalizeMessage(data["message"]);
    if (dataMsg) return dataMsg;
  }

  const err = record["error"];
  const errMsg = normalizeMessage(err);
  if (errMsg) return errMsg;

  if (isRecord(err)) {
    const nestedMsg = normalizeMessage(err["message"]);
    if (nestedMsg) return nestedMsg;
  }

  return null;
}

export function selectRtkqErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (isRecord(error)) {
    const apiMsg = normalizeMessage((error as ApiError).message);
    if (apiMsg) return apiMsg;

    const serializedMsg = normalizeMessage((error as SerializedError).message);
    if (serializedMsg) return serializedMsg;

    const recordMsg = pickMessageFromRecord(error);
    if (recordMsg) return recordMsg;
  }

  if (error instanceof Error) {
    return normalizeMessage(error.message);
  }

  return null;
}
