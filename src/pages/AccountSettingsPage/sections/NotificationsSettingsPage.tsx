import { Card } from "src/shared/ui/Card/Card";

import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

export default function NotificationsSettingsPage() {
  return (
    <AccountSettingsLayout
      title="Account settings"
      subtitle="Notifications"
      content={
        <Card padding="md">
          Notifications settings
        </Card>
      }
    />
  );
}
