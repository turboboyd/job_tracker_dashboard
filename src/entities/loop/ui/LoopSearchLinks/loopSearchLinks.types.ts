import type { Loop, LoopPlatform } from "../../model";

export interface LoopSearchLinksProps {
  loop: Pick<
    Loop,
    | "id"
    | "name"
    | "titles"
    | "location"
    | "radiusKm"
    | "platforms"
    | "remoteMode"
    | "filters"
  >;
  onPageChange: (page: number) => void;
  page: number;
  userId: string | null;
}

export type OpenAddMatchModal = (platform?: LoopPlatform) => void;
