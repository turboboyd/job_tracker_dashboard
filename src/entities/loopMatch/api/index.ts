export {
  loopMatchesApi,
  useGetAllMatchesQuery,
  useGetMatchesByLoopQuery,
  useGetMatchQuery,
  useCreateMatchMutation,
  useUpdateMatchStatusMutation,
  useUpdateMatchMutation,
  useDeleteMatchMutation,
} from "./loopMatchesApi";

export { getUserMatchStats, type MatchStats } from "./getUserMatchStats";

export type {
  UpdateLoopMatchInput as UpdateMatchInput,
  UpdateLoopMatchStatusInput as UpdateMatchStatusInput,
  DeleteLoopMatchInput as DeleteMatchInput,
  CreateLoopMatchInput as CreateMatchInput,
} from "../model/types";
