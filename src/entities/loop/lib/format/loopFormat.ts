import { LOOP_MATCH_STATUSES } from "src/entities/loop/model";
import type { LoopMatchStatus } from "src/entities/loopMatch/model/types";

export function labelStatus(s: LoopMatchStatus) {
  return LOOP_MATCH_STATUSES.find((x) => x.value === s)?.label ?? s;
}

export function prettyStatus(s: string) {
  return s.split("_").join(" ").toUpperCase();
}

export function joinTitles(titles: string[]) {
  return titles
    .map((t) => String(t ?? "").trim())
    .filter(Boolean)
    .join(" OR ");
}


