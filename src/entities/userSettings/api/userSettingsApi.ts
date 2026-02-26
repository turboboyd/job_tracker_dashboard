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

/**
 * Pipeline configuration (stage + sub-status) stored in users/{uid}/private/settings.
 *
 * - stage = big phase (columns in a board)
 * - subStatus = concrete step inside a stage
 */
export type PipelineSubStatus = {
  id: string;
  label: string;
  order: number;
  visible: boolean;
  /**
   * Optional linkage to legacy ProcessStatus for smooth migration.
   * Stored as string to avoid importing feature types into settings.
   */
  legacyStatus?: string;
};

export type PipelineStage = {
  id: string;
  label: string;
  order: number;
  visible: boolean;
  defaultSubStatusId?: string;
  subStatuses: PipelineSubStatus[];
};

export type PipelineConfig = {
  version: number;
  defaultStageId: string;
  stages: PipelineStage[];
};

export type UserSettings = {
  timeZone: string;
  dateFormat: DateFormat;
  uiLanguage?: SupportedLng;
  pipeline?: PipelineConfig;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  timeZone: "Europe/Berlin",
  dateFormat: "DD.MM.YYYY",
  pipeline: {
    version: 1,
    defaultStageId: "active",
    stages: [
      {
        id: "active",
        label: "Active",
        order: 10,
        visible: true,
        defaultSubStatusId: "applied",
        subStatuses: [
          {
            id: "saved",
            label: "Saved",
            order: 10,
            visible: true,
            legacyStatus: "SAVED",
          },
          {
            id: "planned",
            label: "Planned",
            order: 20,
            visible: true,
            legacyStatus: "PLANNED",
          },
          {
            id: "applied",
            label: "Applied",
            order: 30,
            visible: true,
            legacyStatus: "APPLIED",
          },
          {
            id: "viewed",
            label: "Viewed",
            order: 40,
            visible: true,
            legacyStatus: "VIEWED",
          },
          { id: "follow_up_1", label: "Follow-up #1", order: 50, visible: true },
          { id: "follow_up_2", label: "Follow-up #2", order: 60, visible: true },
        ],
      },
      {
        id: "interview",
        label: "Interview",
        order: 20,
        visible: true,
        defaultSubStatusId: "interview_1",
        subStatuses: [
          {
            id: "interview_1",
            label: "Interview 1",
            order: 10,
            visible: true,
            legacyStatus: "INTERVIEW_1",
          },
          {
            id: "interview_2",
            label: "Interview 2",
            order: 20,
            visible: true,
            legacyStatus: "INTERVIEW_2",
          },
          {
            id: "test_task",
            label: "Test task",
            order: 30,
            visible: true,
            legacyStatus: "TEST_TASK",
          },
        ],
      },
      {
        id: "offer",
        label: "Offer",
        order: 30,
        visible: true,
        defaultSubStatusId: "offer",
        subStatuses: [
          {
            id: "offer",
            label: "Offer received",
            order: 10,
            visible: true,
            legacyStatus: "OFFER",
          },
          { id: "negotiation", label: "Negotiation", order: 20, visible: true },
        ],
      },
      {
        id: "hired",
        label: "Hired",
        order: 40,
        visible: true,
        defaultSubStatusId: "hired",
        subStatuses: [{ id: "hired", label: "Hired", order: 10, visible: true }],
      },
      {
        id: "no_response",
        label: "No response",
        order: 50,
        visible: true,
        defaultSubStatusId: "ghosting",
        subStatuses: [
          {
            id: "ghosting",
            label: "Ghosting",
            order: 10,
            visible: true,
            legacyStatus: "NO_RESPONSE",
          },
          { id: "closed", label: "Closed", order: 20, visible: true },
        ],
      },
      {
        id: "rejected",
        label: "Rejected",
        order: 60,
        visible: true,
        defaultSubStatusId: "rejected",
        subStatuses: [
          {
            id: "rejected",
            label: "Rejected",
            order: 10,
            visible: true,
            legacyStatus: "REJECTED",
          },
        ],
      },
      {
        id: "archived",
        label: "Archived",
        order: 70,
        visible: false,
        defaultSubStatusId: "archived",
        subStatuses: [{ id: "archived", label: "Archived", order: 10, visible: true }],
      },
    ],
  },
};

function normalizePipeline(p: Partial<PipelineConfig> | undefined | null): PipelineConfig {
  const base = DEFAULT_USER_SETTINGS.pipeline!;
  const stagesRaw = Array.isArray(p?.stages) ? (p!.stages as PipelineStage[]) : base.stages;

  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;
  const hasString = (v: unknown, key: string): v is Record<string, unknown> =>
    isObject(v) && typeof v[key] === "string";

  const stages: PipelineStage[] = stagesRaw
    .filter((s): s is PipelineStage => hasString(s, "id"))
    .map((s) => {
      const subRaw = Array.isArray(s.subStatuses)
        ? (s.subStatuses as PipelineSubStatus[])
        : [];

      const subStatuses: PipelineSubStatus[] = subRaw
        .filter((x): x is PipelineSubStatus => hasString(x, "id"))
        .map((x) => ({
          id: String(x.id),
          label:
            typeof x.label === "string" && x.label.trim()
              ? x.label.trim()
              : String(x.id),
          order: typeof x.order === "number" ? x.order : 0,
          visible: typeof x.visible === "boolean" ? x.visible : true,
          legacyStatus:
            typeof x.legacyStatus === "string" ? x.legacyStatus : undefined,
        }))
        .sort((a, b) => a.order - b.order);

      const requestedDefaultSub =
        typeof s.defaultSubStatusId === "string" && s.defaultSubStatusId
          ? s.defaultSubStatusId
          : undefined;

      const defaultSubStatusId =
        requestedDefaultSub && subStatuses.some((x) => x.id === requestedDefaultSub)
          ? requestedDefaultSub
          : subStatuses[0]?.id;

      return {
        id: String(s.id),
        label:
          typeof s.label === "string" && s.label.trim() ? s.label.trim() : String(s.id),
        order: typeof s.order === "number" ? s.order : 0,
        visible: typeof s.visible === "boolean" ? s.visible : true,
        defaultSubStatusId,
        subStatuses,
      };
    })
    .sort((a, b) => a.order - b.order);

  const requestedDefaultStage =
    typeof p?.defaultStageId === "string" && p.defaultStageId
      ? p.defaultStageId
      : base.defaultStageId;

  const defaultStageId = stages.some((s) => s.id === requestedDefaultStage)
    ? requestedDefaultStage
    : (stages[0]?.id ?? base.defaultStageId);

  return {
    version: typeof p?.version === "number" ? p.version : base.version,
    defaultStageId,
    stages,
  };
}

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
  const pipeline = normalizePipeline(input?.pipeline);

  return { timeZone, dateFormat, uiLanguage, pipeline };
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