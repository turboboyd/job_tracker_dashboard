import { useTranslation } from "react-i18next";

import { LanguageSelectConnected } from "src/features/i18n";
import { Button, FormField, Input } from "src/shared/ui";

import type { ProfileDetailsSectionProps } from "./ProfilePreferencesCard.types";
import { ProfileSectionShell } from "./ProfileSectionShell";

export function ProfileDetailsSection({
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
}: ProfileDetailsSectionProps) {
  const { t } = useTranslation();

  return (
    <ProfileSectionShell
      title={t("accountSettings.profile.title", "Profile")}
      className="h-full"
    >
      <div className="space-y-3">
        <FormField
          label={t("accountSettings.profile.firstName", "First name")}
          required
        >
          <Input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            disabled={!canEditName}
            placeholder={t("accountSettings.common.placeholder", "—")}
          />
        </FormField>

        <FormField label={t("accountSettings.profile.lastName", "Last name")}>
          <Input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            disabled={!canEditName}
            placeholder={t("accountSettings.common.placeholder", "—")}
          />
        </FormField>

        <FormField label={t("accountSettings.profile.email", "Email")} required>
          <Input value={email} disabled />
        </FormField>

        <FormField
          label={t("accountSettings.profile.appLanguage", "App language")}
          hint={t(
            "accountSettings.profile.appLanguageHint",
            "Stored locally and synced to Firestore when signed in",
          )}
        >
          <LanguageSelectConnected
            value={uiLanguage}
            onChanged={onLanguageChange}
            disabled={isLanguageSaving}
          />
        </FormField>

        {nameError ? (
          <div className="text-sm text-destructive">{nameError}</div>
        ) : null}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onResetName}
            disabled={resetNameDisabled || isNameSaving}
          >
            {t("accountSettings.common.reset", "Reset")}
          </Button>

          <Button onClick={onSaveName} disabled={saveNameDisabled || isNameSaving}>
            {isNameSaving
              ? t("accountSettings.common.saving", "Saving...")
              : t("accountSettings.common.save", "Save")}
          </Button>
        </div>
      </div>
    </ProfileSectionShell>
  );
}
