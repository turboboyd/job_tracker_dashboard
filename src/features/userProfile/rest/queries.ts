import { restGet, restPatch } from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

import { mapResumeUpdateInputToDto, mapUserProfileDto } from "./adapter";
import type {
  UserProfile,
  UserProfileDto,
  UserProfileResumeUpdateInput,
} from "./types";

export function buildCurrentUserUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/users/me`;
}

export async function getCurrentUserProfileViaRest(): Promise<UserProfile> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<UserProfileDto>(buildCurrentUserUrl(apiBaseUrl));
  return mapUserProfileDto(dto);
}

export async function updateCurrentUserResumeViaRest(
  input: UserProfileResumeUpdateInput,
): Promise<UserProfile> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPatch<UserProfileDto>(
    buildCurrentUserUrl(apiBaseUrl),
    mapResumeUpdateInputToDto(input),
  );
  return mapUserProfileDto(dto);
}
