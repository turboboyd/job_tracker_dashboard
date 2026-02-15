import { Card } from "src/shared/ui/Card/Card";

import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

export default function DangerZoneSettingsPage() {
  return (
    <AccountSettingsLayout
      title="Account settings"
      subtitle="Danger Zone"
      content={
        <Card padding="md" shadow="sm" className="space-y-2">
          <div className="text-base font-medium">Danger Zone</div>
          <div className="text-sm text-muted-foreground">
            Add account deletion, data export, and security-sensitive actions
            here.
          </div>
        </Card>
      }
    />
  );
}
