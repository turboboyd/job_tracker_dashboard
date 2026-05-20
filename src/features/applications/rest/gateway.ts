import type { ApplicationGateway, CreateApplicationInput } from "src/entities/application";

import {
  changeApplicationStatusViaRest,
  createApplicationViaRest,
  deleteApplicationViaRest,
  updateApplicationViaRest,
} from "./queries";

function shouldUseArchiveDelete(patch: Partial<unknown> | Record<string, unknown>): boolean {
  return (patch as Record<string, unknown>).archived === true;
}

export function createRestApplicationGateway(): ApplicationGateway {
  return {
    createApplication: async (_db, userId, input: CreateApplicationInput) => {
      const row = await createApplicationViaRest(userId, input);
      return row.id;
    },

    updateApplicationWithHistory: async (_db, userId, appId, patch) => {
      if (shouldUseArchiveDelete(patch)) {
        await deleteApplicationViaRest(appId);
        return;
      }

      await updateApplicationViaRest(userId, appId, patch as Record<string, unknown>);
    },

    changeStatus: async (_db, userId, appId, toStatus) => {
      await changeApplicationStatusViaRest(userId, appId, { toStatus });
    },
  };
}
