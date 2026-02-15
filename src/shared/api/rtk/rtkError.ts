import type { QueryReturnValue } from "@reduxjs/toolkit/query";

export type ApiError = { message: string };
export function rtkError<T = never>(
  message: string,
): QueryReturnValue<T, ApiError, undefined> {
  return { error: { message } };
}
