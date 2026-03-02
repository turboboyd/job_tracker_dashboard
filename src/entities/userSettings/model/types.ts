import type { Timestamp } from "firebase/firestore";

export type DateFormat = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type UiLanguage = "en" | "de" | "ru";

export interface NotificationsSettings {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

export interface UserSettings {
  userId?: string;       
  timeZone?: string;
  dateFormat?: DateFormat;
  uiLanguage?: UiLanguage;
  notifications?: NotificationsSettings;
  updatedAt?: Timestamp;
}
