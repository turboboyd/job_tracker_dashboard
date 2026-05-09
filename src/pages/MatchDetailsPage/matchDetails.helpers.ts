import type { LoopMatch } from "src/entities/loopMatch";
import {
  buildMatchMeta,
  formatMatchedAt,
  formatPlatformLabel,
} from "src/entities/loopMatch";
import { getErrorMessage } from "src/shared/lib";

import type {
  MatchDetailsLabels,
  MatchDetailsPageState,
  MatchDetailsViewModel,
} from "./matchDetails.model";

const EMPTY_VALUE = "-";

export type {
  MatchDetailsLabels,
  MatchDetailsLocationState,
  MatchDetailsPageState,
  MatchDetailsViewModel,
} from "./matchDetails.model";

export { buildMatchDetailsLabels } from "./matchDetails.labels";
export {
  getMatchDetailsBackTo,
  getMatchDetailsLocationState,
  isMatchDetailsLocationState,
} from "./matchDetails.navigation";

export function findMatchById<TMatch extends { id: string }>(
  matches: TMatch[],
  matchId?: string | null,
): TMatch | null {
  if (!matchId) {
    return null;
  }

  return matches.find((match) => match.id === matchId) ?? null;
}

export function getLoopName(
  loopIdToName: ReadonlyMap<string, string>,
  loopId?: string | null,
): string {
  if (!loopId) {
    return "";
  }

  return loopIdToName.get(loopId) ?? "";
}

export function buildMatchDetailsState(args: {
  error: unknown;
  labels: MatchDetailsLabels;
  loading: boolean;
  match: LoopMatch | null;
}): MatchDetailsPageState {
  const { error, labels, loading, match } = args;

  if (loading) {
    return { kind: "loading", message: labels.loading };
  }

  if (error) {
    return { kind: "error", message: getErrorMessage(error) };
  }

  if (!match) {
    return { kind: "notFound", message: labels.notFound };
  }

  return { kind: "ready" };
}

export function buildMatchDetailsViewModel(
  match: LoopMatch,
  loopName: string,
  labels: MatchDetailsLabels,
): MatchDetailsViewModel {
  const matchedAt = match.matchedAt ? formatMatchedAt(match.matchedAt) : "";
  const platform = formatPlatformLabel(match.platform);

  return {
    company: match.company || EMPTY_VALUE,
    description: match.description || labels.noDescription,
    location: match.location || EMPTY_VALUE,
    loopName: loopName || EMPTY_VALUE,
    matchedAt: matchedAt || EMPTY_VALUE,
    meta: buildMatchMeta([match.location, platform, matchedAt, loopName]),
    platform: platform || EMPTY_VALUE,
    status: match.status,
    title: match.title || EMPTY_VALUE,
    url: match.url ?? null,
  };
}
