import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_USER_SETTINGS,
  type ApplicationReminderNotificationSettings,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from "src/entities/userSettings";
import { createApplicationsRepo } from "src/features/applications";
import { useAuthSelectors } from "src/features/auth/model";
import {
  buildGoogleCalendarPlanCandidates,
  createFirestoreGoogleCalendarBrowserSyncRepository,
  createGoogleCalendarProvider,
  getGoogleCalendarClientId,
  requestGoogleCalendarAccessToken,
  syncGoogleCalendarPlanItems,
  type GoogleCalendarApplicationRow,
  type GoogleCalendarBrowserSyncSummary,
} from "src/features/notifications/googleCalendarSync";
import { db } from "src/shared/config/firebase/firestore";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

import {
  getBrowserNotificationPermission,
  getNotificationErrorMessage,
  getReminderSettings,
  hasNotificationSettingsChanges,
} from "./notificationsSettings.helpers";

export function useNotificationsSettingsController() {
  const { user } = useAuthSelectors();
  const uid = user?.uid ?? "";
  const repo = useMemo(() => createApplicationsRepo(db), []);
  const { data, isFetching } = useGetUserSettingsQuery({ uid }, { skip: !uid });
  const settings = data ?? DEFAULT_USER_SETTINGS;
  const initial = useMemo(() => getReminderSettings(settings), [settings]);

  const [draft, setDraft] =
    useState<ApplicationReminderNotificationSettings>(initial);
  const [error, setError] = useState<string | null>(null);
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >(getBrowserNotificationPermission);
  const [googleCalendarSyncSummary, setGoogleCalendarSyncSummary] =
    useState<GoogleCalendarBrowserSyncSummary | null>(null);
  const [googleCalendarSyncError, setGoogleCalendarSyncError] =
    useState<string | null>(null);
  const [isGoogleCalendarSyncing, setIsGoogleCalendarSyncing] = useState(false);
  const [updateSettings, updateState] = useUpdateUserSettingsMutation();

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const hasChanges = useMemo(
    () => hasNotificationSettingsChanges(initial, draft),
    [draft, initial],
  );
  const googleCalendarClientId = getGoogleCalendarClientId();

  const setDraftField = <K extends keyof ApplicationReminderNotificationSettings>(
    key: K,
    value: ApplicationReminderNotificationSettings[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setDraft(initial);
    setError(null);
  };

  const save = async () => {
    if (!uid) return;

    setError(null);

    try {
      await updateSettings({
        uid,
        patch: {
          notifications: {
            ...settings.notifications,
            applicationReminders: draft,
          },
        },
      }).unwrap();
    } catch (nextError: unknown) {
      setError(getNotificationErrorMessage(nextError));
    }
  };

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPermission("unsupported");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setBrowserPermission(permission);

    if (permission !== "granted") {
      setDraftField("browserEnabled", false);
    }
  };

  const syncGoogleCalendarNow = async () => {
    if (!uid) return;

    setGoogleCalendarSyncError(null);
    setGoogleCalendarSyncSummary(null);

    if (!googleCalendarClientId) {
      setGoogleCalendarSyncError("Google Calendar client id is missing");
      return;
    }

    setIsGoogleCalendarSyncing(true);

    try {
      const nowMs = Date.now();
      const accessToken = await requestGoogleCalendarAccessToken({
        clientId: googleCalendarClientId,
        prompt: "consent",
      });
      const rows = (await repo.queryAllActiveApplications(
        uid,
        500,
      )) as GoogleCalendarApplicationRow[];
      const applicationBaseUrl = `${window.location.origin}${RoutePath[AppRoutes.APPLICATIONS]}`;
      const items = buildGoogleCalendarPlanCandidates(
        rows,
        nowMs,
        applicationBaseUrl,
      );
      const summary = await syncGoogleCalendarPlanItems({
        items,
        provider: createGoogleCalendarProvider({
          accessToken: accessToken.accessToken,
        }),
        repository: createFirestoreGoogleCalendarBrowserSyncRepository(db),
        userId: uid,
      });

      setGoogleCalendarSyncSummary(summary);

      if (!draft.googleCalendarEnabled) {
        setDraftField("googleCalendarEnabled", true);
      }

    } catch (nextError: unknown) {
      setGoogleCalendarSyncError(getNotificationErrorMessage(nextError));
    } finally {
      setIsGoogleCalendarSyncing(false);
    }
  };

  return {
    browserPermission,
    draft,
    error,
    googleCalendarSyncError,
    googleCalendarSyncSummary,
    hasChanges,
    isGoogleCalendarClientConfigured: Boolean(googleCalendarClientId),
    isFetching,
    isGoogleCalendarSyncing,
    isSaving: updateState.isLoading,
    requestBrowserPermission,
    reset,
    save,
    setDraftField,
    syncGoogleCalendarNow,
    uid,
  };
}
