import React from "react";

import type { LoopMatchStatus } from "src/entities/loopMatch";

function cmpStr(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function normalizeToken(v: unknown): string {
  return String(v ?? "")
    .toLowerCase()
    .trim();
}

type MatchLike = {
  platform?: unknown;
  status?: unknown;
  loopId: string;
};

type LoopLike = {
  id: string;
  name: string;
};

export function useMatchesDerived(matches: MatchLike[], loops: LoopLike[]) {
  const loopIdToName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const l of loops) map.set(l.id, l.name);
    return map;
  }, [loops]);

  const platformOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      const token = normalizeToken(m.platform);
      if (token) set.add(token);
    }
    return Array.from(set).sort(cmpStr);
  }, [matches]);

  const statusOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      const token = String(m.status ?? "").trim();
      if (token) set.add(token);
    }
    return Array.from(set).sort(cmpStr) as LoopMatchStatus[];
  }, [matches]);

  return { loopIdToName, platformOptions, statusOptions };
}
