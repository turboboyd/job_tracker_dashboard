import type { ApplicationDoc } from "src/entities/application";

import type { LoopMatch } from "../model/types";

import { mapApplicationToLoopMatch } from "./loopMatchesApi.helpers";

export function sortMatchesByMatchedAt(matches: LoopMatch[]): LoopMatch[] {
  return [...matches].sort((left, right) =>
    (right.matchedAt || "").localeCompare(left.matchedAt || ""),
  );
}

export function buildLoopMatches(
  items: { app: ApplicationDoc; id: string }[],
): LoopMatch[] {
  return items.map(({ app, id }) => mapApplicationToLoopMatch(id, app));
}

export function isVisibleLoopMatchApplication(app: ApplicationDoc): boolean {
  return !app.archived && Boolean(app.loopLinkage?.loopId);
}

