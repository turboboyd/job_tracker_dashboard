import type { PipelineConfig } from "src/entities/userSettings";

export function isPipelineDirty(
  savedPipeline: PipelineConfig,
  draft: PipelineConfig,
) {
  try {
    return JSON.stringify(savedPipeline) !== JSON.stringify(draft);
  } catch {
    return true;
  }
}

