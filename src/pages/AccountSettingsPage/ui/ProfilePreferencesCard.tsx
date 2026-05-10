import { useTranslation } from "react-i18next";

import { SectionHeader } from "src/shared/ui";

import { PreferencesSection } from "./PreferencesSection";
import { ProfileDetailsSection } from "./ProfileDetailsSection";
import type { ProfilePreferencesCardProps } from "./ProfilePreferencesCard.types";

export function ProfilePreferencesCard({
  email,
  firstName,
  lastName,
  canEditName,
  isNameSaving,
  nameError,
  saveNameDisabled,
  resetNameDisabled,
  onFirstNameChange,
  onLastNameChange,
  onSaveName,
  onResetName,
  uiLanguage,
  isLanguageSaving,
  onLanguageChange,
  timeZone,
  timeZoneOptions,
  dateFormat,
  isPreferencesSaving,
  preferencesError,
  savePreferencesDisabled,
  resetPreferencesDisabled,
  onTimeZoneChange,
  onDateFormatChange,
  onSavePreferences,
  onResetPreferences,
}: ProfilePreferencesCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("accountSettings.profilePrefs.title", "Profile & Preferences")}
        subtitle={t(
          "accountSettings.profilePrefs.subtitle",
          "Manage your account details and app settings",
        )}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
        <ProfileDetailsSection
          email={email}
          firstName={firstName}
          lastName={lastName}
          canEditName={canEditName}
          isNameSaving={isNameSaving}
          nameError={nameError}
          saveNameDisabled={saveNameDisabled}
          resetNameDisabled={resetNameDisabled}
          onFirstNameChange={onFirstNameChange}
          onLastNameChange={onLastNameChange}
          onSaveName={onSaveName}
          onResetName={onResetName}
          uiLanguage={uiLanguage}
          isLanguageSaving={isLanguageSaving}
          onLanguageChange={onLanguageChange}
        />

        <PreferencesSection
          title={t("accountSettings.preferences.title", "Preferences")}
          subtitle={t("accountSettings.preferences.storage", "Firestore")}
          timeZone={timeZone}
          timeZoneOptions={timeZoneOptions}
          dateFormat={dateFormat}
          onTimeZoneChange={onTimeZoneChange}
          onDateFormatChange={onDateFormatChange}
          isSaving={isPreferencesSaving}
          error={preferencesError}
          saveDisabled={savePreferencesDisabled}
          resetDisabled={resetPreferencesDisabled}
          onReset={onResetPreferences}
          onSave={onSavePreferences}
        />
      </div>
    </div>
  );
}
