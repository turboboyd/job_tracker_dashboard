import type { ApplicationDoc, HistoryEventDoc } from "./types";

export interface ApplicationRow {
  data: ApplicationDoc;
  id: string;
}

export interface ApplicationHistoryRow {
  data: HistoryEventDoc;
  id: string;
}
