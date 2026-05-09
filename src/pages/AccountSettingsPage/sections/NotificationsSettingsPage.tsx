import { useTranslation } from "react-i18next";

import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

import { NotificationsSettingsForm } from "./notificationsSettings.sections";
import { useNotificationsSettingsController } from "./useNotificationsSettingsController";

export default function NotificationsSettingsPage() {
  const { t } = useTranslation();
  const controller = useNotificationsSettingsController();

  return (
    <AccountSettingsLayout
      title={t("accountSettings.page.title", "Account settings")}
      subtitle={t("accountSettings.sidebar.notifications", "Notifications")}
      content={
        <NotificationsSettingsForm
          browserPermission={controller.browserPermission}
          draft={controller.draft}
          error={controller.error}
          hasChanges={controller.hasChanges}
          googleCalendarSyncError={controller.googleCalendarSyncError}
          googleCalendarSyncSummary={controller.googleCalendarSyncSummary}
          isGoogleCalendarClientConfigured={
            controller.isGoogleCalendarClientConfigured
          }
          isGoogleCalendarSyncing={controller.isGoogleCalendarSyncing}
          isFetching={controller.isFetching}
          isSaving={controller.isSaving}
          onBrowserPermissionRequest={controller.requestBrowserPermission}
          onChange={controller.setDraftField}
          onGoogleCalendarSync={controller.syncGoogleCalendarNow}
          onReset={controller.reset}
          onSave={controller.save}
        />
      }
    />
  );
}
