import type { CanonicalFilters, RemoteMode } from "../../model";

export interface LoopLike {
  titles: string[];
  location: string | null;
  radiusKm: number | null;
  remoteMode: RemoteMode;
  filters?: CanonicalFilters;
}

