export type SeriesKey =
  | "ACTIVE"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "NO_RESPONSE";

export type VisibleMap = Record<SeriesKey, boolean>;

export type ModeKey = "created" | "updated";

export type RangeKey = "7d" | "30d" | "90d" | "12m" | "custom";

export type TrendsPoint = {
  date: string;
  ACTIVE: number;
  INTERVIEW: number;
  OFFER: number;
  HIRED: number;
  REJECTED: number;
  NO_RESPONSE: number;
  total: number;
};
