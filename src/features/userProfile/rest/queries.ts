import { restGet, restPatch, restPost } from "src/shared/api";
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

export function buildMarkMatchesSeenUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/users/me/matches-seen`;
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

/**
 * Advance the Matches "seen" watermark to now. The backend then treats matches
 * created after this point as "unseen" for the «Новые» tab.
 */
export async function markMatchesSeenViaRest(): Promise<UserProfile> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<UserProfileDto>(buildMarkMatchesSeenUrl(apiBaseUrl), {});
  return mapUserProfileDto(dto);
}
