import type {
  CanonicalFilters,
  RemoteMode,
  LoopPlatform,
} from "../../model";

export interface LoopForLinks {
  id: string;
  titles: string[];
  location: string | null;
  radiusKm: number | null;
  platforms: LoopPlatform[];
  remoteMode: RemoteMode;
  filters?: CanonicalFilters;
}

export type ActiveLink = { platform: LoopPlatform; url: string } | null;
