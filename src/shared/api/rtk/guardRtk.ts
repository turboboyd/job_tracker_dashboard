import type { QueryReturnValue } from "@reduxjs/toolkit/query";

import { getErrorMessage } from "src/shared/lib/errors";

import { ApiError, rtkError } from "./rtkError";

export async function guardRtk<T>(
  fn: () => Promise<T>,
): Promise<QueryReturnValue<T, ApiError, undefined>> {
  try {
    const data = await fn();
    return { data };
  } catch (e) {
    return rtkError<T>(getErrorMessage(e));
  }
}
