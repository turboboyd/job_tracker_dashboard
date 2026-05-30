export {
  archiveLoopViaRest,
  buildLoopDetailUrl,
  buildLoopsListUrl,
  createLoopViaRest,
  getLoopViaRest,
  listLoopSourceStatsViaRest,
  listLoopsViaRest,
  updateLoopViaRest,
  type BackendLoopListQuery,
  type BackendLoopListResponseDto,
  type LoopSourceStat,
  type LoopSourceStatsResponse,
} from "./rest/queries";

export type { SourceHealth } from "./rest/adapter";

export {
  useBackendLoopsQuery,
  type BackendLoopsQueryOptions,
  type BackendLoopsQueryResult,
} from "./rest/useBackendLoopsQuery";

export {
  mapBackendLoopDtoToLoop,
  mapCreateLoopInputToDto,
  mapUpdateLoopInputToDto,
  type BackendLoopDto,
  type CreateBackendLoopInput,
  type UpdateBackendLoopInput,
} from "./rest/adapter";
