import { LOOP_MATCH_STATUSES } from "src/entities/loop";
import type { LoopMatch, LoopMatchStatus } from "src/entities/loopMatch";


export function groupMatchesByStatus(
  matches: readonly LoopMatch[],
): Map<LoopMatchStatus, LoopMatch[]> {
  const map = new Map<LoopMatchStatus, LoopMatch[]>();

  for (const s of LOOP_MATCH_STATUSES) {
    map.set(s.value, []);
  }

  for (const match of matches) {
    (map.get(match.status) ?? []).push(match);
  }

  return map;
}
