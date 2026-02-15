import { updateProfile } from "firebase/auth";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSelectors } from "src/entities/auth";
import {
  DEFAULT_USER_SETTINGS,
  type DateFormat,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from "src/entities/userSettings/api/userSettingsApi";
import { selectRtkqErrorMessage } from "src/shared/api/selectRtkqErrorMessage";
import { auth } from "src/shared/config/firebase/firebase";
import { getDefaultTimeZone, getTimeZoneOptions } from "src/shared/lib/date";

import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";
import { ProfilePreferencesCard } from "../ui/ProfilePreferencesCard";

function splitDisplayName(
  name: string | null | undefined,
): { firstName: string; lastName: string } {
  const clean = (name ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = clean.split(" ");
  return { firstName, lastName: rest.join(" ") };
}

type PreferencesInitial = {
  firstName: string;
  lastName: string;
  timeZone: string;
  dateFormat: DateFormat;
};

function ProfileSettingsForm({
  uid,
  email,
  canEditName,
  isFetching,
  initial,
  tzOptions,
}: {
  uid: string;
  email: string;
  canEditName: boolean;
  isFetching: boolean;
  initial: PreferencesInitial;
  tzOptions: Array<{ value: string; label: string }>;
}) {


  const [updateSettings, updateSettingsState] = useUpdateUserSettingsMutation();

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);

  const [timeZone, setTimeZone] = useState(initial.timeZone);
  const [dateFormat, setDateFormat] = useState<DateFormat>(initial.dateFormat);

  const nameError: string | null = null;
  const preferencesError = selectRtkqErrorMessage(updateSettingsState.error);

  // These flags can be improved later (dirty-check). For now keep behavior close to original UI.
  const saveNameDisabled = isFetching || updateSettingsState.isLoading;
  const resetNameDisabled = isFetching || updateSettingsState.isLoading;

  const hasPreferencesChanges =
    timeZone !== initial.timeZone || dateFormat !== initial.dateFormat;

  const savePreferencesDisabled =
    isFetching || updateSettingsState.isLoading || !hasPreferencesChanges;
  const resetPreferencesDisabled =
    isFetching || updateSettingsState.isLoading || !hasPreferencesChanges;

  const onSaveName = async () => {
    if (!auth.currentUser) return;
    const next = `${firstName} ${lastName}`.trim();
    await updateProfile(auth.currentUser, { displayName: next });
  };

  const onResetName = () => {
    setFirstName(initial.firstName);
    setLastName(initial.lastName);
  };

  const onSavePreferences = async () => {
    if (!uid) return;

    await updateSettings({
      uid,
      patch: {
        timeZone,
        dateFormat,
      },
    }).unwrap();
  };

  const onResetPreferences = () => {
    setTimeZone(initial.timeZone);
    setDateFormat(initial.dateFormat);
  };

  return (
    <ProfilePreferencesCard
      email={email}
      firstName={firstName}
      lastName={lastName}
      canEditName={canEditName}
      isNameSaving={false}
      nameError={nameError}
      saveNameDisabled={saveNameDisabled}
      resetNameDisabled={resetNameDisabled}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onSaveName={onSaveName}
      onResetName={onResetName}
      timeZone={timeZone}
      timeZoneOptions={tzOptions}
      dateFormat={dateFormat}
      isPreferencesSaving={updateSettingsState.isLoading}
      preferencesError={preferencesError}
      savePreferencesDisabled={savePreferencesDisabled}
      resetPreferencesDisabled={resetPreferencesDisabled}
      onTimeZoneChange={setTimeZone}
      onDateFormatChange={setDateFormat}
      onSavePreferences={onSavePreferences}
      onResetPreferences={onResetPreferences}
    />
  );
}

export default function ProfileSettingsPage() {
  const { t } = useTranslation();

  const { user } = useAuthSelectors();
  const uid = user?.uid ?? "";
  const email = user?.email ?? "";

  const { data, isFetching } = useGetUserSettingsQuery({ uid }, { skip: !uid });

  const initialSettings = data ?? DEFAULT_USER_SETTINGS;

  const tzOptions = useMemo(
    () =>
      getTimeZoneOptions().map((z) => ({
        value: z,
        label: z,
      })),
    [],
  );

  const display = useMemo(
    () => splitDisplayName(user?.displayName),
    [user?.displayName],
  );

  const initial: PreferencesInitial = useMemo(
    () => ({
      firstName: display.firstName,
      lastName: display.lastName,
      timeZone: initialSettings.timeZone || getDefaultTimeZone(),
      dateFormat: initialSettings.dateFormat,
    }),
    [display.firstName, display.lastName, initialSettings.timeZone, initialSettings.dateFormat],
  );

  const canEditName = true;

  // ✅ ключ заставляет пересоздать внутренние useState без useEffect
  const formKey = useMemo(() => {
    const tz = initial.timeZone;
    const df = initial.dateFormat;
    const dn = user?.displayName ?? "";
    const id = uid || "anon";
    return `${id}|${dn}|${tz}|${df}`;
  }, [uid, user?.displayName, initial.timeZone, initial.dateFormat]);

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
          tzOptions={tzOptions}
        />
      }
    />
  );
}
