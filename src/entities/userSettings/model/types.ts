import type { SupportedLng } from "src/shared/config/i18n";

export type DateFormat = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type UiLanguage = SupportedLng;

/**
 * Pipeline configuration stored in users/{uid}/private/settings.
 *
 * stage = board column / coarse pipeline phase
 * subStatus = concrete step inside a stage
 */
export interface PipelineSubStatus {
  id: string;
  label: string;
  order: number;
  visible: boolean;
  /**
   * Optional linkage to legacy ProcessStatus for smooth migration.
   * Stored as string to keep this slice contract independent from application entities.
   */
  legacyStatus?: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  order: number;
  visible: boolean;
  defaultSubStatusId?: string;
  subStatuses: PipelineSubStatus[];
}

export interface PipelineConfig {
  version: number;
  defaultStageId: string;
  stages: PipelineStage[];
}

export interface ApplicationReminderNotificationSettings {
  enabled: boolean;
  leadTimeMinutes: number;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
  browserEnabled: boolean;
  emailEnabled: boolean;
  googleCalendarEnabled: boolean;
}

export interface NotificationSettings {
  applicationReminders: ApplicationReminderNotificationSettings;
}

export interface UserSettings {
  timeZone: string;
  dateFormat: DateFormat;
  uiLanguage?: UiLanguage;
  notifications: NotificationSettings;
  pipeline?: PipelineConfig;
}
