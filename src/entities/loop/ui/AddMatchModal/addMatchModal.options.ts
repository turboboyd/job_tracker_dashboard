import type { TFunction } from "i18next";

import type { StatusKey } from "src/entities/application";

import type { LoopPlatform } from "../../model";
import { LOOP_MATCH_STATUSES, LOOP_PLATFORMS } from "../../model/constants";

import type { AddMatchSelectOption } from "./addMatchModal.types";

export const platformValues = LOOP_PLATFORMS.map((platform) => platform.value);
export const statusValues = LOOP_MATCH_STATUSES.map(
  (status) => status.value,
) as StatusKey[];

export function buildAddMatchPlatformOptions(): AddMatchSelectOption<LoopPlatform>[] {
  return LOOP_PLATFORMS.map((platform) => ({
    label: platform.label,
    value: platform.value,
  }));
}

export function buildAddMatchStatusOptions(
  t: TFunction,
): AddMatchSelectOption<StatusKey>[] {
  return LOOP_MATCH_STATUSES.map((status) => ({
    label: t(`loops.status.${status.value}`, { defaultValue: status.label }),
    value: status.value as StatusKey,
  }));
}

