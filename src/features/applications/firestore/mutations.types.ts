import type {
  EmploymentType,
  ProcessStatus,
  WorkMode,
} from "./types";

export interface CreateApplicationInput {
  companyName: string;
  currentNote?: string;
  employmentType?: EmploymentType;
  legacyMatchId?: string;
  locationText?: string;
  loopId?: string;
  loopMatchedAt?: Date;
  loopPlatform?: string;
  loopSource?: "loop" | "manual" | "import";
  rawDescription?: string;
  roleTitle: string;
  source?: string;
  status?: ProcessStatus;
  tags?: string[];
  vacancyUrl?: string;
  workMode?: WorkMode;
}
