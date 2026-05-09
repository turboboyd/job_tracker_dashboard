import {
  buildMatchMeta,
  formatMatchedAt,
  normalizePlatform,
  type LoopMatch,
} from "src/entities/loopMatch";

const EMPTY_VALUE = "-";

export interface BoardMatchCardViewModel {
  company: string;
  hasUrl: boolean;
  meta: string;
  title: string;
  url: string;
}

function normalizeBoardText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function toBoardDisplayValue(value: string | null | undefined): string {
  return normalizeBoardText(value) || EMPTY_VALUE;
}

export function buildBoardMatchCardViewModel(
  match: LoopMatch,
  loopName: string,
): BoardMatchCardViewModel {
  const matchedAt = formatMatchedAt(match.matchedAt);
  const platform = normalizePlatform(match.platform).toUpperCase();
  const url = normalizeBoardText(match.url);

  return {
    company: toBoardDisplayValue(match.company),
    hasUrl: Boolean(url),
    meta: buildMatchMeta([match.location, platform, matchedAt, loopName]),
    title: toBoardDisplayValue(match.title),
    url,
  };
}

export function canOpenBoardMatchCard(args: {
  busy: boolean;
  overlay: boolean;
}): boolean {
  return !args.busy && !args.overlay;
}

export function getBoardMatchCursorClass(args: {
  busy: boolean;
  overlay: boolean;
}): string {
  if (args.overlay) {
    return "cursor-grabbing";
  }

  if (args.busy) {
    return "opacity-60 cursor-not-allowed";
  }

  return "cursor-pointer md:cursor-grab";
}
