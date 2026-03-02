import type { CanonicalFilters, RemoteMode } from "src/entities/loop/model";

export interface LoopLike {
  titles: string[];
  location: string | null;
  radiusKm: number | null;
  remoteMode: RemoteMode;
  filters?: CanonicalFilters;
}

