export const MATCH_STATUSES = [
  "new",
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  new: "New",
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export function normalizeMatchStatus(v: unknown): MatchStatus | "unknown" {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (
    s === "new" ||
    s === "saved" ||
    s === "applied" ||
    s === "interview" ||
    s === "offer" ||
    s === "rejected"
  ) {
    return s;
  }
  return "unknown";
}
