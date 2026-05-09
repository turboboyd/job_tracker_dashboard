import type { DateFormat, UiLanguage } from "src/entities/userSettings";

import type { TimeZoneOption } from "./PreferencesSection";

export interface ProfileDetailsSectionProps {
  canEditName: boolean;
  email: string;
  firstName: string;
  isLanguageSaving: boolean;
  isNameSaving: boolean;
  lastName: string;
  nameError: string | null;
  onFirstNameChange: (next: string) => void;
  onLanguageChange: (next: UiLanguage) => void | Promise<void>;
  onLastNameChange: (next: string) => void;
  onResetName: () => void;
  onSaveName: () => void;
  resetNameDisabled: boolean;
  saveNameDisabled: boolean;
  uiLanguage: UiLanguage | undefined;
}

export interface ProfilePreferencesCardProps extends ProfileDetailsSectionProps {
  dateFormat: DateFormat;
  isPreferencesSaving: boolean;
  onDateFormatChange: (next: DateFormat) => void;
  onResetPreferences: () => void;
  onSavePreferences: () => void;
  onTimeZoneChange: (next: string) => void;
  preferencesError: string | null;
  resetPreferencesDisabled: boolean;
  savePreferencesDisabled: boolean;
  timeZone: string;
  timeZoneOptions: readonly TimeZoneOption[];
}
