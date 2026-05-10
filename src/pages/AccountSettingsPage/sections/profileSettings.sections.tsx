import type { UiLanguage } from "src/entities/userSettings";

import { ProfilePreferencesCard } from "../ui/ProfilePreferencesCard";

import type { ProfileSettingsInitial } from "./profileSettings.helpers";
import { useProfileSettingsFormController } from "./useProfileSettingsFormController";

interface ProfileSettingsFormProps {
  uid: string;
  email: string;
  canEditName: boolean;
  isFetching: boolean;
  initial: ProfileSettingsInitial;
  timeZoneOptions: { value: string; label: string }[];
}

export function ProfileSettingsForm({
  uid,
  email,
  canEditName,
  isFetching,
  initial,
  timeZoneOptions,
}: ProfileSettingsFormProps) {
  const controller = useProfileSettingsFormController({
    uid,
    isFetching,
    initial,
  });

  return (
    <ProfilePreferencesCard
      email={email}
      firstName={controller.firstName}
      lastName={controller.lastName}
      canEditName={canEditName}
      isNameSaving={controller.isNameSaving}
      nameError={controller.nameError}
      saveNameDisabled={controller.saveNameDisabled}
      resetNameDisabled={controller.resetNameDisabled}
      onFirstNameChange={controller.setFirstName}
      onLastNameChange={controller.setLastName}
      onSaveName={controller.saveName}
      onResetName={controller.resetName}
      uiLanguage={initial.uiLanguage}
      isLanguageSaving={controller.isLanguageSaving}
      onLanguageChange={(next: UiLanguage) => controller.changeLanguage(next)}
      timeZone={controller.timeZone}
      timeZoneOptions={timeZoneOptions}
      dateFormat={controller.dateFormat}
      isPreferencesSaving={controller.isPreferencesSaving}
      preferencesError={controller.preferencesError}
      savePreferencesDisabled={controller.savePreferencesDisabled}
      resetPreferencesDisabled={controller.resetPreferencesDisabled}
      onTimeZoneChange={controller.setTimeZone}
      onDateFormatChange={controller.setDateFormat}
      onSavePreferences={controller.savePreferences}
      onResetPreferences={controller.resetPreferences}
    />
  );
}
