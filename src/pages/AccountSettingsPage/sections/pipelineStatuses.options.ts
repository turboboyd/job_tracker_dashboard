import type { PipelineStage } from "src/entities/userSettings";

import { sortByOrder } from "./pipelineStatuses.mutations";
import type { PipelineOption } from "./pipelineStatuses.ui";

export function buildStageOptions(
  stagesSorted: PipelineStage[],
): PipelineOption[] {
  return stagesSorted.map((stage) => ({
    label: stage.label,
    value: stage.id,
  }));
}

export function buildSubStatusOptions(stage: PipelineStage): PipelineOption[] {
  return sortByOrder(stage.subStatuses).map((subStatus) => ({
    label: subStatus.label,
    value: subStatus.id,
  }));
}
