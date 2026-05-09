import { guardRtk } from "src/shared/api/rtk";

import { requireUidFromState } from "./requireUidFromState";

interface RtkStateReader {
  getState: () => unknown;
}

export function guardAuthRtk<T>(
  api: RtkStateReader,
  runWithUid: (uid: string) => Promise<T>,
) {
  return guardRtk(() => runWithUid(requireUidFromState(api.getState())));
}
