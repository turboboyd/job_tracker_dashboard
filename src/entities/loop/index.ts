export {
  loopsUiReducer,
  setLoopDetailsPage,
  setLoopsListPage,
  setLastLoopsUrl,
} from "./model/loopsUiSlice";
export { selectLoopsResumeUrl } from "./model/loopsUi.selectors";
export type { LoopsUiState } from "./model/loopsUiSlice";

export type {
  Loop,
  LoopMetrics,
  LoopPlatform,
  CanonicalFilters,
  CreateLoopInput,
  SearchFilters,
  RemoteMode,
  LoopStatus,
  UpdateLoopInput,
  PlatformMeta,
  PlatformGroupId,
} from "./model";

export {
  LOOP_MATCH_STATUSES,
  LOOP_PLATFORMS,
  LOOP_PLATFORM_VALUES,
  DEFAULT_CANONICAL_FILTERS,
  PLATFORM_REGISTRY,
  ALL_PLATFORMS,
  RECOMMENDED_PLATFORMS,
  PLATFORM_LABEL_BY_ID,
  PLATFORM_BY_ID,
  GROUPS,
  platformsByGroup,
  buildUrlByPlatform,
  normalizeRoleToTitles,
  DEFAULT_LOOP_NAME,
  DEFAULT_LOOP_FILTERS,
  validateLoopName,
  validateRole,
  validateLocation,
  validateRadiusKm,
  validatePlatforms,
  validateRequiredText,
} from "./model";
export type { ValidationResult } from "./model";

export { CreateLoopModal } from "./ui/CreateLoopModal/CreateLoopModal";
export { LoopSearchLinks } from "./ui/LoopSearchLinks";

export { joinTitles } from "./lib/format";
