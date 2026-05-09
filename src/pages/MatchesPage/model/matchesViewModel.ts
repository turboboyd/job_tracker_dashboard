import type { LoopMatchStatus } from "src/entities/loopMatch";

import type { MatchesFiltersState, TypeMatch } from "./filters";

function cmpStr(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function normalizeToken(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase().trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`.toLowerCase().trim();
  }
  return "";
}

function normalizeStatusToken(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`.trim();
  }
  return "";
}

interface MatchLike {
  platform?: unknown;
  status?: unknown;
  loopId: string;
}

interface LoopLike {
  id: string;
  name: string;
}

export function buildLoopIdToName(loops: LoopLike[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const loop of loops) map.set(loop.id, loop.name);
  return map;
}

export function buildPlatformOptions(matches: MatchLike[]): string[] {
  const set = new Set<string>();
  for (const match of matches) {
    const token = normalizeToken(match.platform);
    if (token) set.add(token);
  }
  return Array.from(set).sort(cmpStr);
}

export function buildStatusOptions(matches: MatchLike[]): LoopMatchStatus[] {
  const set = new Set<string>();
  for (const match of matches) {
    const token = normalizeStatusToken(match.status);
    if (token) set.add(token);
  }
  return Array.from(set).sort(cmpStr) as LoopMatchStatus[];
}

function sortedList(values: readonly string[]): string {
  return [...values].sort(cmpStr).join(",");
}

export function stableFiltersKey(filters: MatchesFiltersState): string {
  return [
    `q=${filters.q.trim()}`,
    `sort=${filters.sort}`,
    `loops=${sortedList(filters.loopIds)}`,
    `platforms=${sortedList(filters.platforms)}`,
    `statuses=${sortedList(filters.statuses)}`,
  ].join("|");
}

export function buildMatchesResetKey(args: {
  userId: string | null | undefined;
  filtersKey: string;
  totalMatches: number;
  visibleMatches: number;
}): string {
  const { userId, filtersKey, totalMatches, visibleMatches } = args;

  return [
    `userId:${userId ?? "anon"}`,
    `filters:${filtersKey}`,
    `total:${totalMatches}`,
    `visible:${visibleMatches}`,
  ].join("|");
}

export function getPagedMatches(matches: TypeMatch[], offset: number, limit: number): TypeMatch[] {
  return matches.slice(offset, offset + limit);
}

export function findMatchById(matches: TypeMatch[], matchId: string | null): TypeMatch | null {
  if (!matchId) return null;
  return matches.find((match) => match.id === matchId) ?? null;
}
