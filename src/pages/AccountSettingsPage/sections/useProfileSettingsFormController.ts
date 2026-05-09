import { updateProfile } from "firebase/auth";
import { useCallback, useState } from "react";

import {
  type DateFormat,
  type UiLanguage,
  useUpdateUserSettingsMutation,
} from "src/entities/userSettings";
import { selectRtkqErrorMessage } from "src/shared/api";
import { auth } from "src/shared/config/firebase/auth";
import { getErrorMessage } from "src/shared/lib";

import {
  hasPreferencesChanges,
  joinDisplayName,
  type ProfileSettingsInitial,
} from "./profileSettings.helpers";

interface UseProfileSettingsFormControllerParams {
  uid: string;
  isFetching: boolean;
  initial: ProfileSettingsInitial;
}

export function useProfileSettingsFormController({
  uid,
  isFetching,
  initial,
}: UseProfileSettingsFormControllerParams) {
  const [updateSettings, updateSettingsState] = useUpdateUserSettingsMutation();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [timeZone, setTimeZone] = useState(initial.timeZone);
  const [dateFormat, setDateFormat] = useState<DateFormat>(initial.dateFormat);
  const [isNameSaving, setIsNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const preferencesError = selectRtkqErrorMessage(updateSettingsState.error);
  const isSettingsSaving = updateSettingsState.isLoading;
  const hasPreferenceChanges = hasPreferencesChanges(initial, {
    timeZone,
    dateFormat,
  });

  const saveName = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }

    setIsNameSaving(true);
    setNameError(null);

    try {
      await updateProfile(auth.currentUser, {
        displayName: joinDisplayName(firstName, lastName),
      });
    } catch (error) {
      setNameError(getErrorMessage(error, "Failed to update profile name."));
    } finally {
      setIsNameSaving(false);
    }
  }, [firstName, lastName]);

  const resetName = useCallback(() => {
    setFirstName(initial.firstName);
    setLastName(initial.lastName);
    setNameError(null);
  }, [initial.firstName, initial.lastName]);

  const changeLanguage = useCallback(
    async (next: UiLanguage) => {
      if (!uid) {
        return;
      }

      await updateSettings({
        uid,
        patch: { uiLanguage: next },
      }).unwrap();
    },
    [uid, updateSettings],
  );

  const savePreferences = useCallback(async () => {
    if (!uid) {
      return;
    }

    await updateSettings({
      uid,
      patch: {
        timeZone,
        dateFormat,
      },
    }).unwrap();
  }, [dateFormat, timeZone, uid, updateSettings]);

  const resetPreferences = useCallback(() => {
    setTimeZone(initial.timeZone);
    setDateFormat(initial.dateFormat);
  }, [initial.dateFormat, initial.timeZone]);

  const isBusy = isFetching || isSettingsSaving || isNameSaving;
  const savePreferencesDisabled =
    isFetching || isSettingsSaving || !hasPreferenceChanges;
  const resetPreferencesDisabled =
    isFetching || isSettingsSaving || !hasPreferenceChanges;

  return {
    firstName,
    lastName,
    timeZone,
    dateFormat,
    isNameSaving,
    isLanguageSaving: isSettingsSaving,
    isPreferencesSaving: isSettingsSaving,
    nameError,
    preferencesError,
    saveNameDisabled: isBusy,
    resetNameDisabled: isBusy,
    savePreferencesDisabled,
    resetPreferencesDisabled,
    setFirstName,
    setLastName,
    setTimeZone,
    setDateFormat,
    saveName,
    resetName,
    changeLanguage,
    savePreferences,
    resetPreferences,
  };
}
