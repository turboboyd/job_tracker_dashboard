import React from "react";
import { useTranslation } from "react-i18next";

import type { DateFormat } from "src/entities/userSettings/api/userSettingsApi";
import { Button } from "src/shared/ui/Button/Button";
import { Card } from "src/shared/ui/Card/Card";
import { FormField } from "src/shared/ui/Form/FormField/FormField";
import { Input } from "src/shared/ui/Form/Input/Input";
import { LanguageSelectConnected } from "src/shared/ui/molecules/LanguageSelect/LanguageSelectConnected";
import { SectionHeader } from "src/shared/ui/PageHeaders/PageHeaders";

import { PreferencesSection, type TimeZoneOption } from "./PreferencesSection";

type ProfileProps = {
  email: string;
  firstName: string;
  lastName: string;
  canEditName: boolean;
  isNameSaving: boolean;
  nameError: string | null;
  saveNameDisabled: boolean;
  resetNameDisabled: boolean;
  onFirstNameChange: (next: string) => void;
  onLastNameChange: (next: string) => void;
  onSaveName: () => void;
  onResetName: () => void;

  timeZone: string;
  timeZoneOptions: ReadonlyArray<TimeZoneOption>;
  dateFormat: DateFormat;
  isPreferencesSaving: boolean;
  preferencesError: string | null;
  savePreferencesDisabled: boolean;
  resetPreferencesDisabled: boolean;
  onTimeZoneChange: (next: string) => void;
  onDateFormatChange: (next: DateFormat) => void;
  onSavePreferences: () => void;
  onResetPreferences: () => void;
};

function SectionShell({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={["p-4", "flex flex-col", className ?? ""].join(" ")}>
      <div className="mb-3 text-sm font-semibold text-foreground">{title}</div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

export function ProfilePreferencesCard(props: ProfileProps) {
  const { t } = useTranslation();

  const {
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
  } = props;

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
        {/* LEFT */}
        <SectionShell
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

            <FormField
              label={t("accountSettings.profile.lastName", "Last name")}
            >
              <Input
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                disabled={!canEditName}
                placeholder={t("accountSettings.common.placeholder", "—")}
              />
            </FormField>

            <FormField
              label={t("accountSettings.profile.email", "Email")}
              required
            >
              <Input value={email} disabled />
            </FormField>

            <FormField
              label={t("accountSettings.profile.appLanguage", "App language")}
              hint={t(
                "accountSettings.profile.appLanguageHint",
                "Stored locally and synced to Firestore when signed in",
              )}
            >
              <LanguageSelectConnected />
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

              <Button
                onClick={onSaveName}
                disabled={saveNameDisabled || isNameSaving}
              >
                {isNameSaving
                  ? t("accountSettings.common.saving", "Saving...")
                  : t("accountSettings.common.save", "Save")}
              </Button>
            </div>
          </div>
        </SectionShell>

        {/* RIGHT */}
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
