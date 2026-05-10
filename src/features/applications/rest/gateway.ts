import type { ApplicationGateway, CreateApplicationInput } from "src/entities/application";
import { getBackendConfig } from "src/shared/config";
import { restPost, restPatch } from "src/shared/api";

import { mapCreateInputToDto, mapPatchToDto } from "./adapter";

export function createRestApplicationGateway(): ApplicationGateway {
  return {
    createApplication: async (_db, _userId, input: CreateApplicationInput) => {
      const { apiBaseUrl } = getBackendConfig();
      const dto = await restPost<{ id: string }>(
        `${apiBaseUrl}/applications`,
        mapCreateInputToDto(input),
      );
      return dto.id;
    },

    updateApplicationWithHistory: async (_db, _userId, appId, patch) => {
      const { apiBaseUrl } = getBackendConfig();
      const body = mapPatchToDto(patch);
      if (Object.keys(body).length === 0) return;
      await restPatch(`${apiBaseUrl}/applications/${appId}`, body);
    },

    changeStatus: async (_db, _userId, appId, toStatus) => {
      const { apiBaseUrl } = getBackendConfig();
      await restPost(`${apiBaseUrl}/applications/${appId}/status`, {
        to_status: toStatus,
      });
    },
  };
}
