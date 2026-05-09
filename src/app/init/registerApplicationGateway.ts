import type { Firestore } from "firebase/firestore";

import {
  registerApplicationGateway,
  type ApplicationDoc,
  type HistoryEventDoc,
  type ProcessStatus,
} from "src/entities/application";

registerApplicationGateway({
  createApplication: async (db: Firestore, userId: string, input) => {
    const { createApplication } = await import("src/features/applications");

    return createApplication(db, userId, {
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      ...(input.vacancyUrl !== undefined ? { vacancyUrl: input.vacancyUrl } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.locationText !== undefined ? { locationText: input.locationText } : {}),
      ...(input.workMode !== undefined ? { workMode: input.workMode } : {}),
      ...(input.employmentType !== undefined ? { employmentType: input.employmentType } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.currentNote !== undefined ? { currentNote: input.currentNote } : {}),
      ...(input.rawDescription !== undefined ? { rawDescription: input.rawDescription } : {}),
      ...(input.loopId !== undefined ? { loopId: input.loopId } : {}),
      ...(input.loopPlatform !== undefined ? { loopPlatform: input.loopPlatform } : {}),
      ...(input.loopMatchedAt !== undefined ? { loopMatchedAt: input.loopMatchedAt } : {}),
      ...(input.loopSource !== undefined ? { loopSource: input.loopSource } : {}),
      ...(input.legacyMatchId !== undefined ? { legacyMatchId: input.legacyMatchId } : {}),
    });
  },
  updateApplicationWithHistory: async (
    db: Firestore,
    userId: string,
    appId: string,
    patch: Partial<ApplicationDoc> | Record<string, unknown>,
    buildHistory: (current: ApplicationDoc) => HistoryEventDoc[],
  ) => {
    const { updateApplicationWithHistory } = await import("src/features/applications");

    return updateApplicationWithHistory(db, userId, appId, patch, buildHistory);
  },
  changeStatus: async (
    db: Firestore,
    userId: string,
    appId: string,
    toStatus: ProcessStatus,
  ) => {
    const { changeStatus } = await import("src/features/applications");

    return changeStatus(db, userId, appId, toStatus);
  },
});
