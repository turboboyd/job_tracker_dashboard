import { useTranslation } from "react-i18next";

import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

import { ProfileSettingsForm } from "./profileSettings.sections";
import { useProfileSettingsPageController } from "./useProfileSettingsPageController";

export default function ProfileSettingsPage() {
  const { t } = useTranslation();
  const {
    uid,
    email,
    initial,
    isFetching,
    timeZoneOptions,
    formKey,
    canEditName,
  } = useProfileSettingsPageController();

  return (
    <AccountSettingsLayout
      title={t("accountSettings.page.title", "Account settings")}
      subtitle={t("accountSettings.sidebar.profile", "Profile")}
      content={
        <ProfileSettingsForm
          key={formKey}
          uid={uid}
          email={email}
          canEditName={canEditName}
          isFetching={isFetching}
          initial={initial}
          timeZoneOptions={timeZoneOptions}
        />
      }
    />
  );
}
