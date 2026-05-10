import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";

import { buildStageOptions } from "./pipelineStatuses.options";
import type { PipelineToolbarProps } from "./pipelineStatuses.types";
import { PIPELINE_COPY, PipelineNativeSelect } from "./pipelineStatuses.ui";

export function PipelineToolbar({
  draft,
  stagesSorted,
  isDirty,
  isFetching,
  isSaving,
  canSave,
  onDraftChange,
  onAddStage,
  onReset,
  onResetToDefaults,
  onSave,
}: PipelineToolbarProps) {
  const isBusy = isFetching || isSaving;
  const stageOptions = buildStageOptions(stagesSorted);

  return (
    <Card padding="md" shadow="sm" className="space-y-3">
      <div className="flex items-start justify-between gap-md">
        <div>
          <div className="text-base font-medium">{PIPELINE_COPY.title}</div>
          <div className="text-sm text-muted-foreground">
            {PIPELINE_COPY.subtitle}
          </div>
        </div>

        <div className="flex gap-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetToDefaults}
            disabled={isBusy}
          >
            {PIPELINE_COPY.resetToDefaults}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!isDirty || isBusy}
          >
            {PIPELINE_COPY.reset}
          </Button>
          <Button size="sm" onClick={() => void onSave()} disabled={!canSave}>
            {PIPELINE_COPY.save}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-sm">
        <div className="text-sm text-muted-foreground">
          {PIPELINE_COPY.defaultStage}
        </div>
        <PipelineNativeSelect
          disabled={isBusy || stageOptions.length === 0}
          options={stageOptions}
          value={draft.defaultStageId}
          onChange={(defaultStageId) =>
            onDraftChange({ ...draft, defaultStageId })
          }
        />

        <Button
          size="sm"
          variant="outline"
          onClick={onAddStage}
          disabled={isBusy}
        >
          + {PIPELINE_COPY.addStage}
        </Button>
      </div>
    </Card>
  );
}
