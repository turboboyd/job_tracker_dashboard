import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { clampPage, getErrorMessage } from "src/shared/lib";

import { useUpdateLoopMutation } from "../../api/loopApi";
import { mapWorkModeToRemoteMode, openUrl } from "../../lib";
import { normalizeRoleToTitles, type LoopPlatform } from "../../model";

import { buildAppliedBadges, buildLoopForLinks } from "./loopSearchLinks.helpers";
import type { LoopSearchLinksProps } from "./loopSearchLinks.types";
import { useLoopSearchLinksState } from "./useLoopSearchLinksState";

const PAGE_SIZE = 12;

export function useLoopSearchLinksController({
  loop,
  userId,
  page,
  onPageChange,
}: LoopSearchLinksProps) {
  const { t } = useTranslation();
  const [updateLoop, updateState] = useUpdateLoopMutation();

  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddMatchModalOpen, setIsAddMatchModalOpen] = useState(false);
  const [defaultPlatform, setDefaultPlatform] = useState<LoopPlatform | undefined>(
    undefined,
  );

  const loopForState = buildLoopForLinks(loop);
  const {
    draftFilters,
    setDraftFilters,
    applyDraftFilters,
    resetFilters,
    appliedFilters,
    activeLink,
    setActive,
    links,
  } = useLoopSearchLinksState(loopForState);

  const isSaving = updateState.isLoading;
  const canEditSources = Boolean(userId) && !isSaving;
  const totalPages = Math.max(1, Math.ceil(links.length / PAGE_SIZE));
  const safePage = Math.max(1, Math.min(totalPages, clampPage(page)));
  const offset = (safePage - 1) * PAGE_SIZE;

  const info = useMemo(() => {
    if (links.length === 0) return { from: 0, to: 0 };

    const from = offset + 1;
    const to = Math.min(links.length, offset + PAGE_SIZE);
    return { from, to };
  }, [links.length, offset]);

  const pagedLinks = useMemo(
    () => links.slice(offset, offset + PAGE_SIZE),
    [links, offset],
  );

  const appliedBadges = useMemo(
    () => buildAppliedBadges(appliedFilters, t),
    [appliedFilters, t],
  );

  const handleApply = async () => {
    applyDraftFilters();
    onPageChange(1);

    if (!userId) return;

    try {
      await updateLoop({
        loopId: loop.id,
        name: loop.name,
        titles: normalizeRoleToTitles(draftFilters.role),
        location: draftFilters.location,
        radiusKm: draftFilters.radiusKm,
        remoteMode: mapWorkModeToRemoteMode(draftFilters.workMode),
        filters: draftFilters,
      }).unwrap();

      setIsSettingsOpen(false);
    } catch (err) {
      console.error("Failed to save filters:", getErrorMessage(err));
    }
  };

  const handleReset = () => {
    resetFilters();
    onPageChange(1);
  };

  const handleSaveSources = async (nextPlatforms: LoopPlatform[]) => {
    if (!userId) return;

    try {
      await updateLoop({
        loopId: loop.id,
        platforms: nextPlatforms,
      }).unwrap();
    } catch (err) {
      console.error("Failed to update sources:", getErrorMessage(err));
    }
  };

  const openAddModal = (platform?: LoopPlatform) => {
    setDefaultPlatform(platform);
    setIsAddMatchModalOpen(true);
  };

  const handleOpenLink = (platform: LoopPlatform, url: string) => {
    setActive(platform, url);
    openUrl(url);
  };

  return {
    activeLink,
    appliedBadges,
    canEditSources,
    defaultPlatform,
    draftFilters,
    handleApply,
    handleOpenLink,
    handleReset,
    handleSaveSources,
    info,
    isAddMatchModalOpen,
    isSaving,
    isSettingsOpen,
    isSourcesModalOpen,
    links,
    loop,
    onAddLink: openAddModal,
    onOpenAdd: () => openAddModal(),
    onPageChange,
    pagedLinks,
    safePage,
    setDraftFilters,
    setIsAddMatchModalOpen,
    setIsSettingsOpen,
    setIsSourcesModalOpen,
    t,
    totalPages,
    userId,
  };
}
