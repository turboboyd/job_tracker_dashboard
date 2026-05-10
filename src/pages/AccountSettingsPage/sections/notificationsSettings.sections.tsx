import {
  Bell,
  CalendarClock,
  ExternalLink,
  Mail,
  MonitorCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { ApplicationReminderNotificationSettings } from "src/entities/userSettings";
import { Button, Card, SectionHeader } from "src/shared/ui";

import {
  REMINDER_LEAD_TIME_OPTIONS,
  normalizeReminderLeadTime,
} from "./notificationsSettings.helpers";

interface NotificationsSettingsFormProps {
  browserPermission: NotificationPermission | "unsupported";
  draft: ApplicationReminderNotificationSettings;
  error: string | null;
  googleCalendarSyncError: string | null;
  googleCalendarSyncSummary: {
    failed: number;
    processed: number;
    synced: number;
  } | null;
  hasChanges: boolean;
  isGoogleCalendarClientConfigured: boolean;
  isGoogleCalendarSyncing: boolean;
  isFetching: boolean;
  isSaving: boolean;
  onBrowserPermissionRequest: () => void;
  onChange: <K extends keyof ApplicationReminderNotificationSettings>(
    key: K,
    value: ApplicationReminderNotificationSettings[K],
  ) => void;
  onReset: () => void;
  onGoogleCalendarSync: () => void;
  onSave: () => void;
}

interface ToggleRowProps {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onChange: (checked: boolean) => void;
}

function ToggleRow({
  checked,
  description,
  disabled = false,
  icon,
  label,
  onChange,
}: ToggleRowProps) {
  return (
    <label
      className={[
        "flex items-start gap-3 rounded-lg border border-border bg-background p-3",
        disabled ? "opacity-60" : "cursor-pointer hover:bg-muted/60",
      ].join(" ")}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function ReminderTimingFields({
  draft,
  onChange,
}: {
  draft: ApplicationReminderNotificationSettings;
  onChange: NotificationsSettingsFormProps["onChange"];
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">
          {t("accountSettings.notifications.leadTime")}
        </span>
        <select
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          value={draft.leadTimeMinutes}
          onChange={(event) =>
            onChange("leadTimeMinutes", normalizeReminderLeadTime(event.target.value))
          }
        >
          {REMINDER_LEAD_TIME_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {t(`accountSettings.notifications.leadTimeOptions.${value}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">
          {t("accountSettings.notifications.digestTime")}
        </span>
        <input
          type="time"
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          value={draft.dailyDigestTime}
          disabled={!draft.dailyDigestEnabled}
          onChange={(event) => onChange("dailyDigestTime", event.target.value)}
        />
      </label>
    </div>
  );
}

function BrowserPermissionPanel({
  browserPermission,
  onRequest,
}: {
  browserPermission: NotificationPermission | "unsupported";
  onRequest: () => void;
}) {
  const { t } = useTranslation();

  if (browserPermission === "granted") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        {t("accountSettings.notifications.browserGranted")}
      </div>
    );
  }

  if (browserPermission === "unsupported") {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {t("accountSettings.notifications.browserUnsupported")}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-sm text-muted-foreground">
        {t("accountSettings.notifications.browserPermissionHint")}
      </div>
      <Button size="sm" variant="outline" shape="pill" onClick={onRequest}>
        {t("accountSettings.notifications.requestBrowserPermission")}
      </Button>
    </div>
  );
}

function GoogleCalendarConnectionPanel({
  enabled,
  error,
  isConfigured,
  isSyncing,
  onSync,
  summary,
}: {
  enabled: boolean;
  error: string | null;
  isConfigured: boolean;
  isSyncing: boolean;
  onSync: () => void;
  summary: NotificationsSettingsFormProps["googleCalendarSyncSummary"];
}) {
  const { t } = useTranslation();
  const statusClass = enabled
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
    : "border-border bg-muted/30 text-muted-foreground";
  const statusText = enabled
    ? t("accountSettings.notifications.googleCalendarSyncEnabled")
    : t("accountSettings.notifications.googleCalendarSyncDisabled");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("accountSettings.notifications.googleCalendarConnection")}
            </span>
            <span
              className={[
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                statusClass,
              ].join(" ")}
            >
              {statusText}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isConfigured
              ? t("accountSettings.notifications.googleCalendarConnectionDesc")
              : t("accountSettings.notifications.googleCalendarNotConfigured")}
          </p>
          {summary ? (
            <p className="text-xs text-muted-foreground">
              {t("accountSettings.notifications.googleCalendarSyncResult", {
                failed: summary.failed,
                processed: summary.processed,
                synced: summary.synced,
              })}
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        shape="pill"
        className="gap-2"
        disabled={!isConfigured || isSyncing}
        onClick={onSync}
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        {isSyncing
          ? t("accountSettings.notifications.googleCalendarSyncing")
          : t("accountSettings.notifications.connectGoogleCalendar")}
      </Button>
    </div>
  );
}

function getFooterText({
  error,
  hasChanges,
  noChangesText,
}: {
  error: string | null;
  hasChanges: boolean;
  noChangesText: string;
}): string {
  if (error) return error;
  if (!hasChanges) return noChangesText;

  return "";
}

export function NotificationsSettingsForm({
  browserPermission,
  draft,
  error,
  googleCalendarSyncError,
  googleCalendarSyncSummary,
  hasChanges,
  isGoogleCalendarClientConfigured,
  isGoogleCalendarSyncing,
  isFetching,
  isSaving,
  onBrowserPermissionRequest,
  onChange,
  onGoogleCalendarSync,
  onReset,
  onSave,
}: NotificationsSettingsFormProps) {
  const { t } = useTranslation();

  const footerText = getFooterText({
    error,
    hasChanges,
    noChangesText: t("accountSettings.preferences.noChanges"),
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("accountSettings.notifications.title")}
        subtitle={t("accountSettings.notifications.subtitle")}
      />

      <Card padding="md" shadow="sm" className="space-y-4">
        <ToggleRow
          checked={draft.enabled}
          icon={<Bell className="h-4 w-4" aria-hidden="true" />}
          label={t("accountSettings.notifications.applicationReminders")}
          description={t("accountSettings.notifications.applicationRemindersDesc")}
          onChange={(checked) => onChange("enabled", checked)}
        />

        <ReminderTimingFields draft={draft} onChange={onChange} />

        <ToggleRow
          checked={draft.dailyDigestEnabled}
          icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
          label={t("accountSettings.notifications.dailyDigest")}
          description={t("accountSettings.notifications.dailyDigestDesc")}
          onChange={(checked) => onChange("dailyDigestEnabled", checked)}
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ToggleRow
            checked={draft.browserEnabled}
            icon={<MonitorCheck className="h-4 w-4" aria-hidden="true" />}
            label={t("accountSettings.notifications.browser")}
            description={t("accountSettings.notifications.browserDesc")}
            onChange={(checked) => onChange("browserEnabled", checked)}
          />
          <ToggleRow
            checked={draft.emailEnabled}
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            label={t("accountSettings.notifications.email")}
            description={t("accountSettings.notifications.emailDesc")}
            onChange={(checked) => onChange("emailEnabled", checked)}
          />
          <ToggleRow
            checked={draft.googleCalendarEnabled}
            icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
            label={t("accountSettings.notifications.googleCalendar")}
            description={t("accountSettings.notifications.googleCalendarDesc")}
            onChange={(checked) => onChange("googleCalendarEnabled", checked)}
          />
        </div>

        <BrowserPermissionPanel
          browserPermission={browserPermission}
          onRequest={onBrowserPermissionRequest}
        />

        <GoogleCalendarConnectionPanel
          enabled={draft.googleCalendarEnabled}
          error={googleCalendarSyncError}
          isConfigured={isGoogleCalendarClientConfigured}
          isSyncing={isGoogleCalendarSyncing}
          onSync={onGoogleCalendarSync}
          summary={googleCalendarSyncSummary}
        />

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {t("accountSettings.notifications.integrationNote")}
        </div>

        {footerText ? (
          <div
            className={
              error
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {footerText}
          </div>
        ) : null}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onReset}
            disabled={!hasChanges || isSaving || isFetching}
          >
            {t("accountSettings.common.reset")}
          </Button>
          <Button
            onClick={onSave}
            disabled={!hasChanges || isSaving || isFetching}
          >
            {isSaving
              ? t("accountSettings.common.saving")
              : t("accountSettings.common.save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
