import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_USER_SETTINGS,
  useGetUserSettingsQuery,
} from "src/entities/userSettings";
import { createApplicationsRepo } from "src/features/applications";
import { useAuthSelectors } from "src/features/auth/model";
import { getPendingNextStepInteractions } from "src/features/contacts";
import {
  buildReminderEmailOutboxItems,
  enqueueEmailOutboxItems,
} from "src/features/notifications/emailOutbox";
import {
  buildGoogleCalendarOutboxItems,
  enqueueGoogleCalendarOutboxItems,
  type GoogleCalendarPlanItem,
} from "src/features/notifications/googleCalendarSync";
import { db } from "src/shared/config/firebase/firestore";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

import {
  APPLICATION_REMINDER_CHECK_INTERVAL_MS,
  APPLICATION_REMINDER_FETCH_LIMIT,
  buildApplicationPlanCandidates,
  buildApplicationReminderCandidates,
  buildDailyDigestCandidate,
  buildInteractionNextStepCandidates,
  readSentReminderKeys,
  writeSentReminderKeys,
  type ApplicationDailyDigestCandidate,
  type ApplicationReminderCandidate,
  type InteractionNextStepCandidate,
  type ReminderApplicationRow,
  type ReminderInteractionRow,
} from "./applicationReminderEngine.helpers";

function canShowBrowserNotifications(): boolean {
  return typeof window !== "undefined" &&
    "Notification" in window &&
    window.Notification.permission === "granted";
}

function formatReminderTime(actionAtMs: number, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(actionAtMs));
}

function buildAbsoluteUrl(path: string): string {
  return `${window.location.origin}${path}`;
}

function formatDigestLine(
  candidate: ApplicationReminderCandidate,
  language: string,
  untitled: string,
  noCompany: string,
): string {
  const roleTitle = candidate.roleTitle || untitled;
  const companyName = candidate.companyName || noCompany;
  const summary = `${formatReminderTime(candidate.actionAtMs, language)} - ${roleTitle} / ${companyName}`;

  return candidate.nextActionText
    ? `${summary}: ${candidate.nextActionText}`
    : summary;
}

async function queueEmailReminderOutbox({
  applicationBaseUrl,
  calendarUrl,
  candidates,
  digestCandidate,
  enabled,
  language,
  nowMs,
  userId,
}: {
  applicationBaseUrl: string;
  calendarUrl: string;
  candidates: ApplicationReminderCandidate[];
  digestCandidate: ApplicationDailyDigestCandidate | null;
  enabled: boolean;
  language: string;
  nowMs: number;
  userId: string;
}): Promise<void> {
  if (!enabled) return;

  const outboxItems = buildReminderEmailOutboxItems({
    applicationBaseUrl,
    calendarUrl,
    candidates,
    digestCandidate,
    language,
    nowMs,
    userId,
  });

  if (outboxItems.length > 0) {
    await enqueueEmailOutboxItems(db, userId, outboxItems);
  }
}

async function queueGoogleCalendarOutbox({
  applicationBaseUrl,
  candidates,
  enabled,
  nowMs,
  userId,
}: {
  applicationBaseUrl: string;
  candidates: GoogleCalendarPlanItem[];
  enabled: boolean;
  nowMs: number;
  userId: string;
}): Promise<void> {
  if (!enabled) return;

  const outboxItems = buildGoogleCalendarOutboxItems({
    applicationBaseUrl,
    candidates,
    nowMs,
    userId,
  });

  if (outboxItems.length > 0) {
    await enqueueGoogleCalendarOutboxItems(db, userId, outboxItems);
  }
}

export function ApplicationReminderEngine() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userId, isAuthReady, isAuthenticated } = useAuthSelectors();
  const repo = useMemo(() => createApplicationsRepo(db), []);
  const { data: settingsData } = useGetUserSettingsQuery(
    { uid: userId ?? "" },
    { skip: !userId || !isAuthReady || !isAuthenticated },
  );

  const reminderSettings =
    settingsData?.notifications.applicationReminders ??
    DEFAULT_USER_SETTINGS.notifications.applicationReminders;
  const language = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    if (!userId || !isAuthReady || !isAuthenticated) return undefined;
    if (!reminderSettings.enabled) {
      return undefined;
    }

    const canUseBrowserNotifications =
      reminderSettings.browserEnabled && canShowBrowserNotifications();
    const canQueueEmailReminders = reminderSettings.emailEnabled;
    const canQueueGoogleCalendarSync = reminderSettings.googleCalendarEnabled;

    if (
      !canUseBrowserNotifications &&
      !canQueueEmailReminders &&
      !canQueueGoogleCalendarSync
    ) {
      return undefined;
    }

    let cancelled = false;

    const openApplication = (appId: string) => {
      window.focus();
      void navigate(`${RoutePath[AppRoutes.APPLICATIONS]}/${appId}`);
    };

    const openCalendar = () => {
      window.focus();
      void navigate(RoutePath[AppRoutes.DASHBOARD_CALENDAR]);
    };

    const showNotification = (candidate: ApplicationReminderCandidate) => {
      const title = t("common.applicationReminder.title", {
        defaultValue: "Application reminder",
      });
      const roleTitle =
        candidate.roleTitle ||
        t("common.applicationReminder.untitled", {
          defaultValue: "Untitled application",
        });
      const companyName =
        candidate.companyName ||
        t("common.applicationReminder.noCompany", {
          defaultValue: "No company",
        });
      const timeText = formatReminderTime(candidate.actionAtMs, language);
      const body = candidate.nextActionText
        ? `${roleTitle} / ${companyName}\n${candidate.nextActionText}\n${timeText}`
        : `${roleTitle} / ${companyName}\n${timeText}`;

      const notification = new window.Notification(title, {
        body,
        tag: candidate.key,
      });

      notification.onclick = () => {
        openApplication(candidate.appId);
        notification.close();
      };
    };

    const showInteractionNextStepNotification = (
      candidate: InteractionNextStepCandidate,
    ) => {
      const title = t("common.applicationReminder.nextStepTitle", {
        defaultValue: "Follow-up reminder",
      });
      const timeText = formatReminderTime(candidate.nextStepAtMs, language);
      const body = `${candidate.summary}\n${timeText}`;

      const notification = new window.Notification(title, {
        body,
        tag: candidate.key,
      });

      notification.onclick = () => {
        void navigate(RoutePath[AppRoutes.CONTACTS]);
        notification.close();
      };
    };

    const showDailyDigestNotification = (candidate: ApplicationDailyDigestCandidate) => {
      const title = t("common.applicationReminder.digestTitle", {
        defaultValue: "Today's application plan",
      });
      const summary = t("common.applicationReminder.digestBody", {
        count: candidate.count,
        defaultValue: "{{count}} planned application actions today",
      });
      const untitled = t("common.applicationReminder.untitled", {
        defaultValue: "Untitled application",
      });
      const noCompany = t("common.applicationReminder.noCompany", {
        defaultValue: "No company",
      });
      const itemLines = candidate.items
        .slice(0, 3)
        .map((item) => formatDigestLine(item, language, untitled, noCompany));
      const remaining = candidate.count - itemLines.length;
      const moreLine =
        remaining > 0
          ? t("common.applicationReminder.digestMore", {
              count: remaining,
              defaultValue: "+{{count}} more",
            })
          : "";
      const body = [summary, ...itemLines, moreLine].filter(Boolean).join("\n");

      const notification = new window.Notification(title, {
        body,
        tag: candidate.key,
      });

      notification.onclick = () => {
        openCalendar();
        notification.close();
      };
    };

    const checkReminders = async () => {
      try {
        const [rows, interactionRows] = await Promise.all([
          repo.queryAllActiveApplications(
            userId,
            APPLICATION_REMINDER_FETCH_LIMIT,
          ) as Promise<ReminderApplicationRow[]>,
          getPendingNextStepInteractions(db, userId, 100) as Promise<
            { id: string; data: ReminderInteractionRow["data"] }[]
          >,
        ]);
        if (cancelled) return;

        const browserSentKeys = readSentReminderKeys(userId);
        const emailSentKeys = new Set<string>();
        const nowMs = Date.now();

        // ── Application reminders ──────────────────────────────────────────
        const browserCandidates = canUseBrowserNotifications
          ? buildApplicationReminderCandidates(
              rows,
              reminderSettings,
              nowMs,
              browserSentKeys,
              userId,
            )
          : [];
        const browserDigestCandidate = canUseBrowserNotifications
          ? buildDailyDigestCandidate(
              rows,
              reminderSettings,
              nowMs,
              browserSentKeys,
              userId,
            )
          : null;
        const emailCandidates = canQueueEmailReminders
          ? buildApplicationReminderCandidates(
              rows,
              reminderSettings,
              nowMs,
              emailSentKeys,
              userId,
            )
          : [];
        const emailDigestCandidate = canQueueEmailReminders
          ? buildDailyDigestCandidate(
              rows,
              reminderSettings,
              nowMs,
              emailSentKeys,
              userId,
            )
          : null;

        // ── Interaction next-step reminders ────────────────────────────────
        const interactionNextStepCandidates = canUseBrowserNotifications
          ? buildInteractionNextStepCandidates(
              interactionRows,
              reminderSettings.leadTimeMinutes,
              nowMs,
              browserSentKeys,
              userId,
            )
          : [];

        const applicationBaseUrl = buildAbsoluteUrl(
          RoutePath[AppRoutes.APPLICATIONS],
        );
        const googleCalendarCandidates = canQueueGoogleCalendarSync
          ? buildApplicationPlanCandidates(rows, nowMs, applicationBaseUrl)
          : [];
        let hasNewBrowserNotifications = false;

        for (const candidate of browserCandidates) {
          showNotification(candidate);
          browserSentKeys.add(candidate.key);
          hasNewBrowserNotifications = true;
        }

        if (browserDigestCandidate) {
          showDailyDigestNotification(browserDigestCandidate);
          browserSentKeys.add(browserDigestCandidate.key);
          hasNewBrowserNotifications = true;
        }

        for (const candidate of interactionNextStepCandidates) {
          showInteractionNextStepNotification(candidate);
          browserSentKeys.add(candidate.key);
          hasNewBrowserNotifications = true;
        }

        if (hasNewBrowserNotifications) {
          writeSentReminderKeys(userId, browserSentKeys);
        }

        await queueEmailReminderOutbox({
          applicationBaseUrl,
          calendarUrl: buildAbsoluteUrl(RoutePath[AppRoutes.DASHBOARD_CALENDAR]),
          candidates: emailCandidates,
          digestCandidate: emailDigestCandidate,
          enabled: canQueueEmailReminders,
          language,
          nowMs,
          userId,
        });

        await queueGoogleCalendarOutbox({
          applicationBaseUrl,
          candidates: googleCalendarCandidates,
          enabled: canQueueGoogleCalendarSync,
          nowMs,
          userId,
        });
      } catch {
        // Local reminders are best-effort and should never interrupt the app.
      }
    };

    void checkReminders();
    const intervalId = window.setInterval(
      () => {
        void checkReminders();
      },
      APPLICATION_REMINDER_CHECK_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    isAuthReady,
    isAuthenticated,
    language,
    navigate,
    reminderSettings,
    repo,
    t,
    userId,
  ]);

  return null;
}
