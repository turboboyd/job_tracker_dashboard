import type {
  PipelineConfig,
  PipelineStage,
  PipelineSubStatus,
} from "src/entities/userSettings";

export function subStatus(
  id: string,
  order: number,
  overrides: Partial<PipelineSubStatus> = {},
): PipelineSubStatus {
  return {
    id,
    label: id,
    order,
    visible: true,
    ...overrides,
  };
}

export function stage(
  id: string,
  order: number,
  subStatuses: PipelineSubStatus[] = [subStatus(`${id}-sub`, 10)],
  overrides: Partial<PipelineStage> = {},
): PipelineStage {
  const firstSubStatusId = subStatuses[0]?.id;
  const base: PipelineStage = {
    id,
    label: id,
    order,
    visible: true,
    subStatuses,
  };

  if (firstSubStatusId) {
    base.defaultSubStatusId = firstSubStatusId;
  }

  return {
    ...base,
    ...overrides,
  };
}

export function pipeline(overrides: Partial<PipelineConfig> = {}): PipelineConfig {
  return {
    version: 1,
    defaultStageId: "applied",
    stages: [
      stage("applied", 10, [subStatus("sent", 10), subStatus("review", 20)]),
      stage("interview", 20, [subStatus("hr", 10), subStatus("tech", 20)]),
    ],
    ...overrides,
  };
}
