import type { CanonicalFilters, RemoteMode } from "../../model";

export function mapWorkModeToRemoteMode(
  workMode: CanonicalFilters["workMode"]
): RemoteMode {
  return workMode === "remote_only" ? "remote_only" : "any";
}
