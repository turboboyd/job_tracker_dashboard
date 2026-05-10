import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";

import { StatusSelect } from "./matchDetails.primitives";
import type { MatchActionsCardProps } from "./matchDetails.types";

export function MatchActionsCard({
  busy,
  currentStatus,
  actionsTitle,
  statusLabel,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  onUpdateStatus,
}: MatchActionsCardProps) {
  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      <div className="text-base font-semibold text-foreground">
        {actionsTitle}
      </div>

      <div className="mt-md flex flex-col gap-md">
        <StatusSelect
          value={currentStatus}
          disabled={busy}
          label={statusLabel}
          onChange={onUpdateStatus}
        />

        <div className="flex flex-wrap gap-sm">
          <Button
            variant="outline"
            size="sm"
            shape="pill"
            disabled={busy}
            onClick={onEdit}
          >
            {editLabel}
          </Button>

          <Button
            variant="outline"
            size="sm"
            shape="pill"
            disabled={busy}
            onClick={onDelete}
          >
            {deleteLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}

