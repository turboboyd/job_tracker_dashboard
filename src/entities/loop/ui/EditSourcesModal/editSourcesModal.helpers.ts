import type { TFunction } from "i18next";

import {
  ALL_PLATFORMS,
  GROUPS,
  PLATFORM_LABEL_BY_ID,
  platformsByGroup,
  type LoopPlatform,
} from "../../model";

export interface EditSourcesModalLabels {
  cancel: string;
  description: string;
  editSources: string;
  groups: string;
  platforms: string;
  recommended: string;
  save: string;
  saving: string;
  selectAll: string;
  selected: string;
}

export interface EditSourcesGroupRow {
  id: (typeof GROUPS)[number]["id"];
  isAllSelected: boolean;
  selectedCount: number;
  title: string;
  totalCount: number;
}

export interface EditSourcesPlatformRow {
  checked: boolean;
  label: string;
  platform: LoopPlatform;
}

export function dedupePlatforms(
  platforms: readonly LoopPlatform[] | undefined,
): LoopPlatform[] {
  return Array.from(new Set(platforms ?? []));
}

export function togglePlatformSelection(
  currentPlatforms: readonly LoopPlatform[],
  platform: LoopPlatform,
): LoopPlatform[] {
  const nextPlatforms = new Set(currentPlatforms);

  if (nextPlatforms.has(platform)) {
    nextPlatforms.delete(platform);
  } else {
    nextPlatforms.add(platform);
  }

  return Array.from(nextPlatforms);
}

export function toggleGroupSelection(
  currentPlatforms: readonly LoopPlatform[],
  groupPlatforms: readonly LoopPlatform[],
): LoopPlatform[] {
  const nextPlatforms = new Set(currentPlatforms);
  const hasWholeGroupSelected = groupPlatforms.every((platform) =>
    nextPlatforms.has(platform),
  );

  for (const platform of groupPlatforms) {
    if (hasWholeGroupSelected) {
      nextPlatforms.delete(platform);
    } else {
      nextPlatforms.add(platform);
    }
  }

  return Array.from(nextPlatforms);
}

export function buildEditSourcesModalLabels(t: TFunction): EditSourcesModalLabels {
  return {
    cancel: t("loops.cancel", { defaultValue: "Cancel" }),
    description: t("loops.editSourcesDescription", {
      defaultValue:
        "Choose job boards/platforms. This controls which search links are generated.",
    }),
    editSources: t("loops.editSources", { defaultValue: "Edit sources" }),
    groups: t("loops.groups", { defaultValue: "Groups" }),
    platforms: t("loops.platforms", { defaultValue: "Platforms" }),
    recommended: t("loops.recommended", { defaultValue: "Recommended" }),
    save: t("loops.save", { defaultValue: "Save" }),
    saving: t("loops.saving", { defaultValue: "Saving..." }),
    selectAll: t("loops.selectAll", { defaultValue: "Select all" }),
    selected: t("loops.selected", { defaultValue: "Selected" }),
  };
}

export function buildEditSourcesGroupRows(
  selectedPlatforms: ReadonlySet<LoopPlatform>,
): EditSourcesGroupRow[] {
  return GROUPS.map((group) => {
    const groupPlatforms = platformsByGroup(group.id);
    const selectedCount = groupPlatforms.filter((platform) =>
      selectedPlatforms.has(platform),
    ).length;

    return {
      id: group.id,
      isAllSelected: groupPlatforms.length > 0 && selectedCount === groupPlatforms.length,
      selectedCount,
      title: group.title,
      totalCount: groupPlatforms.length,
    };
  });
}

export function buildEditSourcesPlatformRows(
  selectedPlatforms: ReadonlySet<LoopPlatform>,
): EditSourcesPlatformRow[] {
  return [...ALL_PLATFORMS]
    .sort((left, right) => {
      const leftLabel = PLATFORM_LABEL_BY_ID[left] ?? left;
      const rightLabel = PLATFORM_LABEL_BY_ID[right] ?? right;
      return leftLabel.localeCompare(rightLabel);
    })
    .map((platform) => ({
      checked: selectedPlatforms.has(platform),
      label: PLATFORM_LABEL_BY_ID[platform] ?? platform,
      platform,
    }));
}
