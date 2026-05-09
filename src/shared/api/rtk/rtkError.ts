/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { QueryReturnValue } from "@reduxjs/toolkit/query";

export interface ApiError { message: string }
export function rtkError<T = never>(
  message: string,
): QueryReturnValue<T, ApiError, {}> {
  return { error: { message } };
}
