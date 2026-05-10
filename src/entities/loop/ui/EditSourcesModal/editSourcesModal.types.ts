import type { GROUPS, LoopPlatform } from "../../model";

import type {
  EditSourcesGroupRow,
  EditSourcesModalLabels,
  EditSourcesPlatformRow,
} from "./editSourcesModal.helpers";

export interface EditSourcesSummaryProps {
  disabled: boolean;
  isSaving: boolean;
  labels: EditSourcesModalLabels;
  onSelectAll: () => void;
  onSelectRecommended: () => void;
  totalSelected: number;
}

export interface EditSourcesGroupSectionProps {
  disabled: boolean;
  isSaving: boolean;
  labels: EditSourcesModalLabels;
  onToggleGroup: (groupId: (typeof GROUPS)[number]["id"]) => void;
  rows: EditSourcesGroupRow[];
}

export interface EditSourcesPlatformsSectionProps {
  disabled: boolean;
  isSaving: boolean;
  labels: EditSourcesModalLabels;
  onTogglePlatform: (platform: LoopPlatform) => void;
  rows: EditSourcesPlatformRow[];
}

export interface EditSourcesActionsProps {
  canSave: boolean;
  disabled: boolean;
  isSaving: boolean;
  labels: EditSourcesModalLabels;
  onCancel: () => void;
  onSave: () => void;
}

export interface EditSourcesModalContentProps {
  canSave: boolean;
  disabled: boolean;
  groupRows: EditSourcesGroupRow[];
  isSaving: boolean;
  labels: EditSourcesModalLabels;
  onCancel: () => void;
  onSave: () => void;
  onSelectAll: () => void;
  onSelectRecommended: () => void;
  onToggleGroup: (groupId: (typeof GROUPS)[number]["id"]) => void;
  onTogglePlatform: (platform: LoopPlatform) => void;
  platformRows: EditSourcesPlatformRow[];
  totalSelected: number;
}

