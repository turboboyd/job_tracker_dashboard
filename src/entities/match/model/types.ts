import type { LoopMatchStatus } from "src/entities/loop/model";

export type MatchSortKey =
  | "matchedAtDesc"
  | "matchedAtAsc"
  | "titleAsc"
  | "companyAsc";

export type MatchesFiltersState = {
  q: string;

  loopIds: string[];
  platforms: string[];
  statuses: LoopMatchStatus[];

  sort: MatchSortKey;
  showAdvanced: boolean;
};

export type Match = {
  id: string;

  userId: string;
  loopId: string;

  title: string;
  company: string;
  location: string;

  platform: string;
  url: string;
  description?: string;
  status: LoopMatchStatus;

  matchedAt: string | null | undefined;

  createdAt: string;
  updatedAt: string;
};

export const defaults: MatchesFiltersState = {
  q: "",
  loopIds: [],
  platforms: [],
  statuses: [],
  sort: "matchedAtDesc",
  showAdvanced: false,
};
