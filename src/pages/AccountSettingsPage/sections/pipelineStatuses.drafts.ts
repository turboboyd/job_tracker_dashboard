import type {
  PipelineStage,
  PipelineSubStatus,
} from "src/entities/userSettings";

import { uidLike } from "./pipelineStatuses.normalize";

export function createStageDraft(order: number): PipelineStage {
  const id = `stage_${uidLike()}`;
  return {
    id,
    label: "New stage",
    order,
    visible: true,
    subStatuses: [createSubStatusDraft(10)],
  };
}

export function createSubStatusDraft(order: number): PipelineSubStatus {
  return {
    id: `sub_${uidLike()}`,
    label: "New status",
    order,
    visible: true,
  };
}

