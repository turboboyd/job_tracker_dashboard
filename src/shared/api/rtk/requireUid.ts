import { selectUid, type StateWithAuth } from "src/entities/auth";

export function requireUidFromState(state: unknown): string {
  const uid = selectUid(state as StateWithAuth);
  if (!uid) throw new Error("Not authenticated");
  return uid;
}
