import type { RemoteMode, LoopPlatform, CanonicalFilters } from "src/entities/loop/model";


export interface CreateLoopInput {
  name: string;
  titles: string[];
  location: string;
  radiusKm: number;
  remoteMode: RemoteMode;
  platforms: LoopPlatform[];
  filters?: CanonicalFilters;
}

export interface UpdateLoopInput {
  loopId: string;

  name?: string;
  titles?: string[];
  location?: string;
  radiusKm?: number;
  remoteMode?: RemoteMode;
  platforms?: LoopPlatform[];

  filters?: CanonicalFilters;
}
