import type { LoopMatch } from "src/entities/loopMatch";

export interface MatchDetailsLocationState {
  from?: { pathname?: string; search?: string };
}

export interface MatchDetailsLabels {
  actionsTitle: string;
  backLabel: string;
  deleteLabel: string;
  descriptionTitle: string;
  editLabel: string;
  loading: string;
  locationLabel: string;
  loopLabel: string;
  matchedAtLabel: string;
  metaTitle: string;
  noDescription: string;
  notFound: string;
  openLinkLabel: string;
  platformLabel: string;
  statusLabel: string;
  subtitle: string;
  title: string;
}

export interface MatchDetailsViewModel {
  company: string;
  description: string;
  location: string;
  loopName: string;
  matchedAt: string;
  meta: string;
  platform: string;
  status: LoopMatch["status"];
  title: string;
  url: string | null;
}

export interface MatchDetailsPageState {
  kind: "error" | "loading" | "notFound" | "ready";
  message?: string;
}
