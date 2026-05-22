export {
  archiveLoopViaRest,
  buildLoopDetailUrl,
  buildLoopsListUrl,
  createLoopViaRest,
  getLoopViaRest,
  listLoopsViaRest,
  updateLoopViaRest,
  type BackendLoopListQuery,
  type BackendLoopListResponseDto,
} from "./rest/queries";

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
