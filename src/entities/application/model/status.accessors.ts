import type { Stage, StatusKey, StatusMeta } from "./status.definitions";
import { ALL_STATUSES, STATUS } from "./status.registry";

export function isStatusKey(value: unknown): value is StatusKey {
  return typeof value === "string" && (value as StatusKey) in STATUS;
}

export function getStatusMeta(status: StatusKey): StatusMeta {
  return STATUS[status];
}

export function getStage(status: StatusKey): Stage {
  return STATUS[status].stage;
}

export function statusesForStage(stage: Stage): StatusMeta[] {
  return ALL_STATUSES.filter((status) => status.stage === stage);
}

