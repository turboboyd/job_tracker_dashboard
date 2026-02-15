import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { RootState } from "src/app/store/rootReducer";
import { baseApi } from "src/shared/api/rtk/baseApi";
import { guardRtk } from "src/shared/api/rtk/guardRtk";
import type { ApiError } from "src/shared/api/rtk/rtkError";
import { db } from "src/shared/config/firebase/firebase";
import { SupportedLng } from "src/shared/config/i18n/i18n";
import { getDefaultTimeZone } from "src/shared/lib/date";



export type DateFormat = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export type UserSettings = {
  timeZone: string;
  dateFormat: DateFormat;
  uiLanguage?: SupportedLng;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  timeZone: "Europe/Berlin",
  dateFormat: "DD.MM.YYYY",
};

function normalizeSettings(
  input: Partial<UserSettings> | undefined | null,
): UserSettings {
  const timeZone =
    typeof input?.timeZone === "string" && input.timeZone.trim()
      ? input.timeZone
      : getDefaultTimeZone();

  const dateFormat: DateFormat =
    input?.dateFormat === "DD.MM.YYYY" ||
    input?.dateFormat === "MM/DD/YYYY" ||
    input?.dateFormat === "YYYY-MM-DD"
      ? input.dateFormat
      : DEFAULT_USER_SETTINGS.dateFormat;

  const uiLanguage = input?.uiLanguage;
  return { timeZone, dateFormat, uiLanguage };
}

const settingsDocRef = (uid: string) =>
  doc(db, "users", uid, "private", "settings");

export const userSettingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUserSettings: build.query<UserSettings, { uid: string }>({
      queryFn: ({
        uid,
      }): Promise<QueryReturnValue<UserSettings, ApiError, undefined>> =>
        guardRtk(async () => {
          const refDoc = settingsDocRef(uid);
          const snap = await getDoc(refDoc);

          if (!snap.exists()) {
            const defaults: UserSettings = {
              ...DEFAULT_USER_SETTINGS,
              timeZone: getDefaultTimeZone(DEFAULT_USER_SETTINGS.timeZone),
            };
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
      ): Promise<QueryReturnValue<UserSettings, ApiError, undefined>> {
        return guardRtk(async () => {
          const refDoc = settingsDocRef(uid);

          const state = api.getState() as RootState;
          const cached = userSettingsApi.endpoints.getUserSettings.select({
            uid,
          })(state)?.data;

          const merged: UserSettings = normalizeSettings({
            ...(cached ?? {
              ...DEFAULT_USER_SETTINGS,
              timeZone: getDefaultTimeZone(DEFAULT_USER_SETTINGS.timeZone),
            }),
            ...patch,
          });
          await setDoc(refDoc, merged, { merge: true });

          return merged;
        });
      },

      async onQueryStarted(
        { uid, patch },
        { dispatch, getState, queryFulfilled },
      ) {
        const cached = userSettingsApi.endpoints.getUserSettings.select({
          uid,
        })(getState())?.data;

        const merged: UserSettings = normalizeSettings({
          ...(cached ?? {
            ...DEFAULT_USER_SETTINGS,
            timeZone: getDefaultTimeZone(DEFAULT_USER_SETTINGS.timeZone),
          }),
          ...patch,
        });

        const patchResult = dispatch(
          userSettingsApi.util.updateQueryData(
            "getUserSettings",
            { uid },
            () => merged,
          ),
        );

        try {
          await queryFulfilled;
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
