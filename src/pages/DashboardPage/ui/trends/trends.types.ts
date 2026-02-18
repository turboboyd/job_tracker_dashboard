export type RangeKey = "7d" | "30d" | "90d" | "12m";
export type ModeKey = "created" | "updated";
export type SeriesKey = "applied" | "interview" | "offer" | "rejected";

export type TrendsPoint = {
  date: string;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
};

export type VisibleMap = Record<SeriesKey, boolean>;
