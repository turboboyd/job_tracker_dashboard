import type { QueryReturnValue } from "@reduxjs/toolkit/query";

export interface ApiError {
  message: string;
}

export type RtkMeta = Record<string, never>;

export function rtkError<T = never>(
  message: string,
): QueryReturnValue<T, ApiError, RtkMeta> {
  return { error: { message } };
}
