export {
  loopMatchesApi,
  useGetAllMatchesQuery,
  useGetMatchesByLoopQuery,
  useGetMatchQuery,
  useCreateMatchMutation,
  useUpdateMatchStatusMutation,
  useUpdateMatchMutation,
  useDeleteMatchMutation,
} from "./api";

export { getUserMatchStats, type MatchStats } from "./api/getUserMatchStats";

export type {
  UpdateMatchInput,
  UpdateMatchStatusInput,
  DeleteMatchInput,
  CreateMatchInput,
} from "./api";

export type {
  LoopMatch,
  LoopMatchStatus,
  CreateLoopMatchInput,
  UpdateLoopMatchStatusInput,
  UpdateLoopMatchInput,
  DeleteLoopMatchInput,
} from "./model/types";

export { MatchCard } from "./ui/matchCard/MatchCard";
export { MatchDetailsModal } from "./ui/matchCard/MatchDetailsModal";
export { formatMatchedAt, normalizePlatform } from "./ui/matchCard/matchFormat";
