import type { BoardCardItem } from "../model/types";

const EMPTY_VALUE = "-";

export interface BoardCardViewModel {
  title: string;
  company: string;
  initial: string;
  location: string;
  loopName: string;
  hasScore: boolean;
  score: number;
  dateLabel: string;
}

function trimText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function formatBoardCardDate(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  return new Date(ms).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function buildBoardCardViewModel(
  item: BoardCardItem,
  loopName: string,
): BoardCardViewModel {
  const company = trimText(item.companyName);
  const title = trimText(item.roleTitle);
  const initialSource = company || title || "?";

  return {
    title: title || EMPTY_VALUE,
    company: company || EMPTY_VALUE,
    initial: initialSource.charAt(0).toUpperCase(),
    location: trimText(item.location),
    loopName: trimText(loopName),
    hasScore: item.matchScore != null,
    score: item.matchScore ?? 0,
    dateLabel: formatBoardCardDate(item.createdAtMs),
  };
}

export function canOpenBoardCard(args: {
  busy: boolean;
  overlay: boolean;
}): boolean {
  return !args.busy && !args.overlay;
}

export function getBoardCardCursorClass(args: {
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
