import type { ReactNode } from "react";

import type { LoopMatchStatus } from "src/entities/loopMatch";

import type {
  MatchDetailsLabels,
  MatchDetailsViewModel,
} from "./matchDetails.model";

export interface MatchDetailsHeaderProps {
  backLabel: string;
  backTo: string;
  subtitle: string;
  title: string;
}

export interface MatchOverviewCardProps {
  company: string;
  meta: string;
  openLinkLabel: string;
  status: LoopMatchStatus;
  title: string;
  url: string | null;
}

export interface MatchActionsCardProps {
  actionsTitle: string;
  busy: boolean;
  currentStatus: LoopMatchStatus;
  deleteLabel: string;
  editLabel: string;
  statusLabel: string;
  onDelete: () => void;
  onEdit: () => void;
  onUpdateStatus: (next: LoopMatchStatus) => void;
}

export interface MatchMetaCardProps {
  location: string;
  locationLabel: string;
  loopLabel: string;
  loopName: string;
  matchedAt: string;
  matchedAtLabel: string;
  platform: string;
  platformLabel: string;
  title: string;
}

export interface MatchDescriptionCardProps {
  description: string;
  title: string;
}

export interface MatchDetailsShellProps {
  children: ReactNode;
  header: ReactNode;
}

export interface MatchDetailsContentProps {
  busy: boolean;
  details: MatchDetailsViewModel;
  labels: MatchDetailsLabels;
  onDelete: () => void;
  onEdit: () => void;
  onUpdateStatus: (status: LoopMatchStatus) => void;
}
