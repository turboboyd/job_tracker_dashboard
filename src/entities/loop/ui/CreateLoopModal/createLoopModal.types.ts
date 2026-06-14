import type { CanonicalFilters, CreateLoopInput, Loop } from "../../model";

export interface CreateLoopModalProps {
  onCreateLoop: (input: CreateLoopInput) => Promise<Pick<Loop, "id">>;
  onCreated: (loopId: string) => void;
  onOpenChange: (v: boolean) => void;
  open: boolean;
}

export interface CreateLoopForm {
  location: string;
  name: string;
  platforms: string[];
  role: string;
  /** Numeric text input; empty falls back to the 30 km default. */
  radiusKm: string;
  workMode: CanonicalFilters["workMode"];
  includeKeywords: string;
  excludeKeywords: string;
}
