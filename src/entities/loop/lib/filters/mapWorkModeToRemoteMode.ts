import type { CanonicalFilters, RemoteMode } from "src/entities/loop/model";

export function mapWorkModeToRemoteMode(
  workMode: CanonicalFilters["workMode"]
): RemoteMode {
  return workMode === "remote_only" ? "remote_only" : "any";
}
