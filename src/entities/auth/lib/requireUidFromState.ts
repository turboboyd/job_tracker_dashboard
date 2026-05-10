import { requireStateValue } from "src/shared/api/rtk";

import { selectUid, type StateWithAuth } from "../model/authSelectors";

export function requireUidFromState(state: unknown): string {
  return requireStateValue(
    state,
    (currentState) => selectUid(currentState as StateWithAuth),
    "Not authenticated",
  );
}
