import { useMemo } from "react";

import {
  DEFAULT_USER_SETTINGS,
  useGetUserSettingsQuery,
} from "src/entities/userSettings";
import { useAuthSelectors } from "src/features/auth/model";

import {
  buildProfileFormKey,
  buildProfileSettingsInitial,
  buildTimeZoneOptions,
} from "./profileSettings.helpers";

export function useProfileSettingsPageController() {
  const { user } = useAuthSelectors();
  const uid = user?.uid ?? "";
  const email = user?.email ?? "";

  const { data, isFetching } = useGetUserSettingsQuery({ uid }, { skip: !uid });
  const settings = data ?? DEFAULT_USER_SETTINGS;

  const initial = useMemo(
    () => buildProfileSettingsInitial(settings, user?.displayName),
    [settings, user?.displayName],
  );
  const timeZoneOptions = useMemo(() => buildTimeZoneOptions(), []);
  const formKey = useMemo(
    () =>
      buildProfileFormKey({
        uid,
        displayName: user?.displayName,
        initial,
      }),
    [initial, uid, user?.displayName],
  );

  return {
    uid,
    email,
    initial,
    isFetching,
    timeZoneOptions,
    formKey,
    canEditName: true,
  };
}
