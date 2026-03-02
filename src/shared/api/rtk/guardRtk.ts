/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { QueryReturnValue } from "@reduxjs/toolkit/query";

import { getErrorMessage } from "src/shared/lib/errors";

import type { ApiError } from "./rtkError";
import { rtkError } from "./rtkError";

export async function guardRtk<T>(
  fn: () => Promise<T>,
): Promise<QueryReturnValue<T, ApiError, {}>> {
  try {
    const data = await fn();
    return { data };
  } catch (e) {
    return rtkError<T>(getErrorMessage(e));
  }
}
