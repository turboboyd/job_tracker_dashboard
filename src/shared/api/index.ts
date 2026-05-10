export {
  publicStatsDoc,
  userApplicationDoc,
  userApplicationsCol,
  userLoopDoc,
  userLoopMatchDoc,
  userLoopMatchesCol,
  userLoopsCol,
  userOutcomeDoc,
  userSettingsDoc,
} from "./firestoreRefs";

export {
  buildAuthedRequest,
  restDelete,
  restGet,
  restPatch,
  restPost,
} from "./rest/restClient";
export type { HttpMethod } from "./rest/restClient";

export { baseApi } from "./rtk/baseApi";
export type { AppEndpointBuilder } from "./rtk/endpointBuilder";
export { guardRtk } from "./rtk/guardRtk";
export { requireStateValue } from "./rtk/requireStateValue";
export { rtkError, type ApiError, type RtkMeta } from "./rtk/rtkError";

export { selectRtkqErrorMessage } from "./selectRtkqErrorMessage";
