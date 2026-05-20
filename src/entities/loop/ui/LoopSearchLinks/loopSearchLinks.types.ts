import type { Loop, LoopPlatform } from "../../model";

export type UpdateLoopSearchLinksInput = Partial<
  Pick<
    Loop,
    "name" | "titles" | "location" | "radiusKm" | "remoteMode" | "platforms" | "filters"
  >
>;

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
  onUpdateLoop?: (patch: UpdateLoopSearchLinksInput) => Promise<void>;
  onAddVacancy?: () => void;
  page: number;
  userId: string | null;
}

export type OpenAddMatchModal = (platform?: LoopPlatform) => void;
