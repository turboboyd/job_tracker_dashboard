import { doc, getDoc, setDoc } from "firebase/firestore";

import { baseApi, guardRtk } from "src/shared/api";
import { db } from "src/shared/config/firebase/firestore";
import { getDefaultTimeZone } from "src/shared/lib";

import type { UserSettings } from "../model/types";

import { DEFAULT_USER_SETTINGS, normalizeSettings } from "./userSettings.helpers";

export { DEFAULT_USER_SETTINGS } from "./userSettings.helpers";

const settingsDocRef = (uid: string) =>
  doc(db, "users", uid, "private", "settings");

function buildDefaultSettings(): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    timeZone: getDefaultTimeZone(DEFAULT_USER_SETTINGS.timeZone),
  };
}

function mergeSettings(
  cached: UserSettings | undefined,
  patch: Partial<UserSettings>,
): UserSettings {
  return normalizeSettings({
    ...(cached ?? buildDefaultSettings()),
    ...patch,
  });
}

export const userSettingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUserSettings: build.query<UserSettings, { uid: string }>({
      queryFn: ({ uid }) =>
        guardRtk(async () => {
          const refDoc = settingsDocRef(uid);
          const snap = await getDoc(refDoc);

          if (!snap.exists()) {
            const defaults = buildDefaultSettings();
            await setDoc(refDoc, defaults, { merge: true });
            return defaults;
          }

          return normalizeSettings(snap.data() as Partial<UserSettings>);
        }),
      providesTags: (_r, _e, arg) => [{ type: "UserSettings", id: arg.uid }],
    }),

    updateUserSettings: build.mutation<
      UserSettings,
      { uid: string; patch: Partial<UserSettings> }
    >({
      async queryFn(
        { uid, patch },
        api,
      ) {
        return guardRtk(async () => {
          const refDoc = settingsDocRef(uid);

          const state = api.getState() as Parameters<
            ReturnType<typeof userSettingsApi.endpoints.getUserSettings.select>
          >[0];
          const cached = userSettingsApi.endpoints.getUserSettings.select({
            uid,
          })(state)?.data;

          const merged = mergeSettings(cached, patch);
          await setDoc(refDoc, merged, { merge: true });

          return merged;
        });
      },

      async onQueryStarted(
        { uid, patch },
        lifecycleApi,
      ) {
        const currentState = lifecycleApi.getState() as Parameters<
          ReturnType<typeof userSettingsApi.endpoints.getUserSettings.select>
        >[0];

        const cached = userSettingsApi.endpoints.getUserSettings.select({
          uid,
        })(currentState)?.data;

        const merged = mergeSettings(cached, patch);

        const patchResult = lifecycleApi.dispatch(
          userSettingsApi.util.updateQueryData(
            "getUserSettings",
            { uid },
            () => merged,
          ),
        );

        try {
          await lifecycleApi.queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },

      invalidatesTags: (_r, _e, arg) => [{ type: "UserSettings", id: arg.uid }],
    }),
  }),
});

export const { useGetUserSettingsQuery, useUpdateUserSettingsMutation } =
  userSettingsApi;
