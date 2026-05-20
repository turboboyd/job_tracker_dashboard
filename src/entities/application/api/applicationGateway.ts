import type { Firestore } from "firebase/firestore";

import type {
  ApplicationDoc,
  HistoryEventDoc,
  ProcessStatus,
} from "../model/types";

export interface CreateApplicationInput {
  companyName: string;
  roleTitle: string;
  isFavorite?: boolean | undefined;
  vacancyUrl?: string | undefined;
  source?: string | undefined;
  status?: ProcessStatus | undefined;
  locationText?: string | undefined;
  workMode?: ApplicationDoc["job"]["workMode"] | undefined;
  employmentType?: ApplicationDoc["job"]["employmentType"] | undefined;
  tags?: string[] | undefined;
  currentNote?: string | undefined;
  rawDescription?: string | undefined;
  loopId?: string | undefined;
  loopPlatform?: string | undefined;
  loopMatchedAt?: Date | undefined;
  loopSource?: "loop" | "manual" | "import" | undefined;
  legacyMatchId?: string | undefined;
}

export interface ApplicationGateway {
  createApplication: (
    db: Firestore,
    userId: string,
    input: CreateApplicationInput,
  ) => Promise<string>;
  updateApplicationWithHistory: (
    db: Firestore,
    userId: string,
    appId: string,
    patch: Partial<ApplicationDoc> | Record<string, unknown>,
    buildHistory: (current: ApplicationDoc) => HistoryEventDoc[],
  ) => Promise<void>;
  changeStatus: (
    db: Firestore,
    userId: string,
    appId: string,
    toStatus: ProcessStatus,
  ) => Promise<void>;
}

let applicationGateway: ApplicationGateway | null = null;

export function registerApplicationGateway(gateway: ApplicationGateway): void {
  applicationGateway = gateway;
}

export function getApplicationGateway(): ApplicationGateway {
  if (!applicationGateway) {
    throw new Error("Application gateway is not registered");
  }
  return applicationGateway;
}
