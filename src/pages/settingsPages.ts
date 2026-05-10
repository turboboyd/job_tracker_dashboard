import { lazy } from "react";

export const ProfileSettingsPage = lazy(
  () => import("./AccountSettingsPage/sections/ProfileSettingsPage"),
);

export const NotificationsSettingsPage = lazy(
  () => import("./AccountSettingsPage/sections/NotificationsSettingsPage"),
);

export const PipelineStatusesSettingsPage = lazy(
  () => import("./AccountSettingsPage/sections/PipelineStatusesSettingsPage"),
);

export const DangerZoneSettingsPage = lazy(
  () => import("./AccountSettingsPage/sections/DangerZoneSettingsPage"),
);
