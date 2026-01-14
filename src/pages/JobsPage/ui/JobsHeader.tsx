import React from "react";

import { Button } from "src/shared/ui";

export function JobsHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-2xl font-semibold text-foreground">Jobs</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Add and track applications
        </div>
      </div>

      <Button variant="default" shadow="sm" shape="lg" onClick={onAdd}>
        Add job
      </Button>
    </div>
  );
}
