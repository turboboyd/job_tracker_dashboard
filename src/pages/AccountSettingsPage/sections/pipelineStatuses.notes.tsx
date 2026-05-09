import { Card } from "src/shared/ui/Card";

import { PIPELINE_COPY, PIPELINE_NOTES } from "./pipelineStatuses.ui";

export function PipelineNotesCard() {
  return (
    <Card padding="md" shadow="sm" className="space-y-2">
      <div className="text-sm font-medium">{PIPELINE_COPY.notesTitle}</div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {PIPELINE_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </Card>
  );
}
