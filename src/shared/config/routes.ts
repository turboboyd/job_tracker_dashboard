export enum AppRoutes {
  MAIN = "main",
  ABOUT = "about",
  RESOURCES = "resources",
  DASHBOARD_RESOURCES = "dashboard_resources",
  LOGIN = "login",
  REGISTER = "register",
  WHATS_NEW = "whats_new",

  DASHBOARD = "dashboard",
  DASHBOARD_ANALYTICS = "dashboard_analytics",
  DASHBOARD_ACTIVITY = "dashboard_activity",
  DASHBOARD_CALENDAR = "dashboard_calendar",

  APPLICATIONS = "applications",
  APPLICATION_DETAILS = "application_details",
  QUESTIONS = "questions",
  CV_CHECKER = "cv_checker",
  CV_BUILDER = "cv_builder",
  INBOX = "inbox",

  SETTINGS_PROFILE = "settings_profile",
  SETTINGS_NOTIFICATIONS = "settings_notifications",
  SETTINGS_PIPELINE_STATUSES = "settings_pipeline_statuses",
  SETTINGS_DANGER_ZONE = "settings_danger_zone",

  PROFILE_QUESTIONS = "profile_questions",

  BOARD = "board",
  LOOPS = "loops",
  LOOP_DETAILS = "loop_details",
  MATCHES = "matches",
  CONTACTS = "contacts",

  NOT_FOUND = "not_found",
}

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.MAIN]: "/",
  [AppRoutes.ABOUT]: "/about",
  [AppRoutes.RESOURCES]: "/resources",
  [AppRoutes.DASHBOARD_RESOURCES]: "/dashboard/resources",
  [AppRoutes.LOGIN]: "/login",
  [AppRoutes.REGISTER]: "/register",
  [AppRoutes.WHATS_NEW]: "/whats-new",

  [AppRoutes.DASHBOARD]: "/dashboard",
  [AppRoutes.DASHBOARD_ANALYTICS]: "/dashboard/analytics",
  [AppRoutes.DASHBOARD_ACTIVITY]: "/dashboard/activity",
  [AppRoutes.DASHBOARD_CALENDAR]: "/dashboard/calendar",

  [AppRoutes.APPLICATIONS]: "/dashboard/applications",
  [AppRoutes.APPLICATION_DETAILS]: "/dashboard/applications/:appId",
  [AppRoutes.QUESTIONS]: "/dashboard/questions",
  [AppRoutes.CV_CHECKER]: "/dashboard/cv-checker",
  [AppRoutes.CV_BUILDER]: "/dashboard/cv-builder",
  [AppRoutes.INBOX]: "/dashboard/inbox",

  [AppRoutes.SETTINGS_PROFILE]: "/dashboard/settings/profile",
  [AppRoutes.SETTINGS_NOTIFICATIONS]: "/dashboard/settings/notifications",
  [AppRoutes.SETTINGS_PIPELINE_STATUSES]: "/dashboard/settings/pipeline-statuses",
  [AppRoutes.SETTINGS_DANGER_ZONE]: "/dashboard/settings/danger-zone",

  [AppRoutes.PROFILE_QUESTIONS]: "/dashboard/profile/questions",

  [AppRoutes.BOARD]: "/dashboard/board",
  [AppRoutes.LOOPS]: "/dashboard/loops",
  [AppRoutes.LOOP_DETAILS]: "/dashboard/loops/:loopId",
  [AppRoutes.MATCHES]: "/dashboard/matches",
  [AppRoutes.CONTACTS]: "/dashboard/contacts",

  [AppRoutes.NOT_FOUND]: "/*",
};
