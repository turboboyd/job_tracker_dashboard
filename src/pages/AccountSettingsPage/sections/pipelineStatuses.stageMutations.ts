import type {
  PipelineConfig,
  PipelineStage,
} from "src/entities/userSettings";

import { createStageDraft } from "./pipelineStatuses.drafts";
import { getDefaultPipeline } from "./pipelineStatuses.normalize";
import {
  moveItem,
  resequence,
  sortByOrder,
} from "./pipelineStatuses.ordering";

export function updateStagePatch(
  pipeline: PipelineConfig,
  stageId: string,
  patch: Partial<PipelineStage>,
): PipelineConfig {
  return {
    ...pipeline,
    stages: pipeline.stages.map((stage) =>
      stage.id === stageId ? { ...stage, ...patch } : stage,
    ),
  };
}

export function addStageToPipeline(pipeline: PipelineConfig): PipelineConfig {
  const nextStage = createStageDraft((pipeline.stages.length + 1) * 10);
  const stages = resequence(sortByOrder([...pipeline.stages, nextStage]));
  const defaultStageId = pipeline.defaultStageId ?? stages[0]?.id ?? nextStage.id;

  return { ...pipeline, stages, defaultStageId };
}

export function deleteStageFromPipeline(
  pipeline: PipelineConfig,
  stageId: string,
): PipelineConfig {
  const stages = resequence(
    sortByOrder(pipeline.stages.filter((stage) => stage.id !== stageId)),
  );
  const fallbackDefaultStageId = getDefaultPipeline().defaultStageId;
  const defaultStageId =
    pipeline.defaultStageId === stageId
      ? stages[0]?.id ?? fallbackDefaultStageId
      : pipeline.defaultStageId;

  return { ...pipeline, stages, defaultStageId };
}

export function moveStageInPipeline(
  pipeline: PipelineConfig,
  stageId: string,
  direction: -1 | 1,
): PipelineConfig {
  const sorted = sortByOrder(pipeline.stages);
  const index = sorted.findIndex((stage) => stage.id === stageId);

  if (index === -1) {
    return pipeline;
  }

  return { ...pipeline, stages: resequence(moveItem(sorted, index, direction)) };
}

