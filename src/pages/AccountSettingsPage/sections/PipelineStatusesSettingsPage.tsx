import { Card } from "src/shared/ui/Card/Card";

import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

export default function PipelineStatusesSettingsPage() {
  return (
    <AccountSettingsLayout
      title="Account settings"
      subtitle="Pipeline/Statuses"
      content={
        <Card padding="md" shadow="sm" className="space-y-2">
          <div className="text-base font-medium">Pipeline/Statuses</div>
          <div className="text-sm text-muted-foreground">
            Here you can configure pipeline stages and statuses (naming,
            ordering, visibility, defaults).
          </div>
        </Card>
      }
    />
  );
}
