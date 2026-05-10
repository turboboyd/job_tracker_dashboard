import type { QueryReturnValue } from "@reduxjs/toolkit/query";

import { getErrorMessage } from "src/shared/lib/errors";

import type { ApiError, RtkMeta } from "./rtkError";
import { rtkError } from "./rtkError";

export async function guardRtk<T>(
  fn: () => Promise<T>,
): Promise<QueryReturnValue<T, ApiError, RtkMeta>> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    return rtkError<T>(getErrorMessage(error));
  }
}
