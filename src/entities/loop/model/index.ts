export { clampRadiusKm } from "./searchFilters";

export type {
  Loop,
  RemoteMode,
  CanonicalFilters,
  SearchFilters,
  LoopPlatform,
  PlatformMeta,
  PlatformGroupId
} from "./types";



export { LOOP_MATCH_STATUSES, LOOP_PLATFORMS } from "./constants";
export { DEFAULT_CANONICAL_FILTERS } from "./canonicalFilters";

export {

  PLATFORM_REGISTRY,
  ALL_PLATFORMS,
  RECOMMENDED_PLATFORMS,
  PLATFORM_LABEL_BY_ID,
  PLATFORM_BY_ID,
  GROUPS,
  platformsByGroup,
  buildUrlByPlatform,
} from "./platformRegistry";

export { normalizeRoleToTitles } from "./roleTitles";

export { DEFAULT_LOOP_NAME, DEFAULT_LOOP_FILTERS } from "./defaults";

export {
  type ValidationResult,
  validateLoopName,
  validateRole,
  validateLocation,
  validateRadiusKm,
  validatePlatforms,
  validateRequiredText,
} from "./validators";


