import type {
  CanonicalFilters,
  RemoteMode,
  LoopPlatform,
} from "src/entities/loop/model";

export type LoopForLinks = {
  id: string;
  titles: string[];
  location: string | null;
  radiusKm: number | null;
  platforms: LoopPlatform[];
  remoteMode: RemoteMode;
  filters?: CanonicalFilters;
};

export type ActiveLink = { platform: LoopPlatform; url: string } | null;
