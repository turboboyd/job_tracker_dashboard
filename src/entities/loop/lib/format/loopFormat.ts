import type { StatusKey } from "src/entities/application";

import { LOOP_MATCH_STATUSES } from "../../model/constants";

export function labelStatus(s: StatusKey) {
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
