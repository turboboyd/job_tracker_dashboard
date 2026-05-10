import { getDefaultTimeZone } from "src/shared/lib";

import type {
  DateFormat,
  NotificationSettings,
  PipelineConfig,
  PipelineStage,
  PipelineSubStatus,
  UserSettings,
} from "../model/types";

import { DEFAULT_USER_SETTINGS } from "./userSettings.defaults";

export { DEFAULT_USER_SETTINGS };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasString(v: unknown, key: string): v is Record<string, unknown> {
  return isObject(v) && typeof v[key] === "string";
}

export function normalizePipeline(p: Partial<PipelineConfig> | undefined | null): PipelineConfig {
  const base = DEFAULT_USER_SETTINGS.pipeline!;
  const stagesRaw = Array.isArray(p?.stages) ? p.stages : base.stages;

  const stages: PipelineStage[] = stagesRaw
    .filter((s): s is PipelineStage => hasString(s, "id"))
    .map((s) => {
      const subRaw = Array.isArray(s.subStatuses) ? s.subStatuses : [];

      const subStatuses: PipelineSubStatus[] = subRaw
        .filter((x): x is PipelineSubStatus => hasString(x, "id"))
        .map((x) => {
          const baseSub: PipelineSubStatus = {
            id: String(x.id),
            label: typeof x.label === "string" && x.label.trim() ? x.label.trim() : String(x.id),
            order: typeof x.order === "number" ? x.order : 0,
            visible: typeof x.visible === "boolean" ? x.visible : true,
          };

          return typeof x.legacyStatus === "string"
            ? { ...baseSub, legacyStatus: x.legacyStatus }
            : baseSub;
        })
        .sort((a, b) => a.order - b.order);

      const requestedDefaultSub =
        typeof s.defaultSubStatusId === "string" && s.defaultSubStatusId
          ? s.defaultSubStatusId
          : undefined;

      const defaultSubStatusId =
        requestedDefaultSub && subStatuses.some((x) => x.id === requestedDefaultSub)
          ? requestedDefaultSub
          : subStatuses[0]?.id;

      const baseStage: PipelineStage = {
        id: String(s.id),
        label: typeof s.label === "string" && s.label.trim() ? s.label.trim() : String(s.id),
        order: typeof s.order === "number" ? s.order : 0,
        visible: typeof s.visible === "boolean" ? s.visible : true,
        subStatuses,
      };

      return defaultSubStatusId ? { ...baseStage, defaultSubStatusId } : baseStage;
    })
    .sort((a, b) => a.order - b.order);

  const requestedDefaultStage =
    typeof p?.defaultStageId === "string" && p.defaultStageId
      ? p.defaultStageId
      : base.defaultStageId;

  const defaultStageId = stages.some((s) => s.id === requestedDefaultStage)
    ? requestedDefaultStage
    : stages[0]?.id ?? base.defaultStageId;

  return {
    version: typeof p?.version === "number" ? p.version : base.version,
    defaultStageId,
    stages,
  };
}

function normalizeLeadTimeMinutes(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_USER_SETTINGS.notifications.applicationReminders.leadTimeMinutes;
  }

  return Math.max(0, Math.min(1440, Math.round(value)));
}

function normalizeDailyDigestTime(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_USER_SETTINGS.notifications.applicationReminders.dailyDigestTime;
  }

  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed)
    ? trimmed
    : DEFAULT_USER_SETTINGS.notifications.applicationReminders.dailyDigestTime;
}

export function normalizeNotificationSettings(
  input: Partial<NotificationSettings> | undefined | null,
): NotificationSettings {
  const base = DEFAULT_USER_SETTINGS.notifications.applicationReminders;
  const incoming = input?.applicationReminders;

  return {
    applicationReminders: {
      enabled: typeof incoming?.enabled === "boolean" ? incoming.enabled : base.enabled,
      leadTimeMinutes: normalizeLeadTimeMinutes(incoming?.leadTimeMinutes),
      dailyDigestEnabled:
        typeof incoming?.dailyDigestEnabled === "boolean"
          ? incoming.dailyDigestEnabled
          : base.dailyDigestEnabled,
      dailyDigestTime: normalizeDailyDigestTime(incoming?.dailyDigestTime),
      browserEnabled:
        typeof incoming?.browserEnabled === "boolean"
          ? incoming.browserEnabled
          : base.browserEnabled,
      emailEnabled:
        typeof incoming?.emailEnabled === "boolean"
          ? incoming.emailEnabled
          : base.emailEnabled,
      googleCalendarEnabled:
        typeof incoming?.googleCalendarEnabled === "boolean"
          ? incoming.googleCalendarEnabled
          : base.googleCalendarEnabled,
    },
  };
}

export function normalizeSettings(input: Partial<UserSettings> | undefined | null): UserSettings {
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
  const notifications = normalizeNotificationSettings(input?.notifications);
  const pipeline = normalizePipeline(input?.pipeline);

  return {
    timeZone,
    dateFormat,
    ...(uiLanguage ? { uiLanguage } : {}),
    notifications,
    pipeline,
  };
}
