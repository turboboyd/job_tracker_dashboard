import type { CanonicalFilters, LoopPlatform } from "../../model";
import { AddMatchModal } from "../AddMatchModal/AddMatchModal";
import { EditSourcesModal } from "../EditSourcesModal/EditSourcesModal";
import { LoopSettingsModal } from "../LoopSettingsModal/LoopSettingsModal";

import type { LoopForLinks } from "./types";

interface SettingsSectionProps {
  draftFilters: CanonicalFilters;
  setDraftFilters: (next: CanonicalFilters) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isSaving: boolean;
  onApply: () => Promise<void>;
  onReset: () => void;
}

export function LoopSearchSettingsSection({
  draftFilters,
  setDraftFilters,
  isSettingsOpen,
  setIsSettingsOpen,
  isSaving,
  onApply,
  onReset,
}: SettingsSectionProps) {
  return (
    <LoopSettingsModal
      open={isSettingsOpen}
      onOpenChange={setIsSettingsOpen}
      value={draftFilters}
      onChange={setDraftFilters}
      disabled={isSaving}
      onApply={onApply}
      onReset={onReset}
    />
  );
}

interface SourcesSectionProps {
  loopPlatforms: LoopForLinks["platforms"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  onSave: (platforms: LoopForLinks["platforms"]) => Promise<void>;
}

export function LoopSearchSourcesSection({
  loopPlatforms,
  open,
  onOpenChange,
  disabled,
  onSave,
}: SourcesSectionProps) {
  return (
    <EditSourcesModal
      open={open}
      onOpenChange={onOpenChange}
      value={loopPlatforms}
      disabled={disabled}
      onSave={onSave}
    />
  );
}

interface AddMatchSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loopId: string;
  defaultPlatform?: LoopPlatform;
}

export function LoopSearchAddMatchSection({
  open,
  onOpenChange,
  loopId,
  defaultPlatform,
}: AddMatchSectionProps) {
  return (
    <AddMatchModal
      open={open}
      onOpenChange={onOpenChange}
      loopId={loopId}
      {...(defaultPlatform !== undefined ? { defaultPlatform } : {})}
    />
  );
}

