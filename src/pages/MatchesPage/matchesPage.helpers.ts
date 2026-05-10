import type { TFunction } from "i18next";

import { getErrorMessage } from "src/shared/lib";

import type { MatchesLoopOption } from "./components/matchesFilters.helpers";

interface LoopLike {
  id: string;
  name: string;
}

interface MatchLike {
  id: string;
  loopId: string;
}

export interface MatchesPageLabels {
  empty: string;
  loading: string;
  subtitle: string;
  title: string;
}

export interface MatchesPageState {
  kind: "empty" | "error" | "loading" | "ready";
  message?: string;
}

export interface MatchesPageCardItem<TMatch extends MatchLike> {
  loopName: string;
  match: TMatch;
}

export function buildMatchesPageLabels(t: TFunction): MatchesPageLabels {
  return {
    empty: t("matches.list.empty"),
    loading: t("matches.common.loading"),
    subtitle: t("matches.list.subtitle"),
    title: t("matches.list.title"),
  };
}

export function buildMatchesPageState(args: {
  error?: unknown;
  isError: boolean;
  isLoading: boolean;
  labels: MatchesPageLabels;
  matchesCount: number;
}): MatchesPageState {
  const { error, isError, isLoading, labels, matchesCount } = args;

  if (isLoading) {
    return { kind: "loading", message: labels.loading };
  }

  if (isError) {
    return { kind: "error", message: getErrorMessage(error) };
  }

  if (matchesCount === 0) {
    return { kind: "empty", message: labels.empty };
  }

  return { kind: "ready" };
}

export function buildMatchesLoopOptions<TLoop extends LoopLike>(
  loops: TLoop[],
): MatchesLoopOption[] {
  return loops.map(({ id, name }) => ({ id, name }));
}

export function getMatchesLoopName(
  loopIdToName: ReadonlyMap<string, string>,
  loopId?: string | null,
): string {
  if (!loopId) {
    return "";
  }

  return loopIdToName.get(loopId) ?? "";
}

export function buildMatchesPageItems<TMatch extends MatchLike>(
  matches: TMatch[],
  loopIdToName: ReadonlyMap<string, string>,
): MatchesPageCardItem<TMatch>[] {
  return matches.map((match) => ({
    loopName: getMatchesLoopName(loopIdToName, match.loopId),
    match,
  }));
}
