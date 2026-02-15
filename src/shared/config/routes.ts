export enum AppRoutes {
  MAIN = "main",
  ABOUT = "about",
  RESOURCES = "resources",
  LOGIN = "login",
  REGISTER = "register",
  WHATS_NEW = "whats_new",

  DASHBOARD = "dashboard",
  APPLICATIONS = "applications",
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

  NOT_FOUND = "not_found",
}

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.MAIN]: "/",
  [AppRoutes.ABOUT]: "/about",
  [AppRoutes.RESOURCES]: "/resources",
  [AppRoutes.LOGIN]: "/login",
  [AppRoutes.REGISTER]: "/register",
  [AppRoutes.WHATS_NEW]: "/whats-new",

  [AppRoutes.DASHBOARD]: "/dashboard",
  [AppRoutes.APPLICATIONS]: "/applications",
  [AppRoutes.QUESTIONS]: "/questions",
  [AppRoutes.CV_CHECKER]: "/cv-checker",
  [AppRoutes.CV_BUILDER]: "/cv-builder",
  [AppRoutes.INBOX]: "/inbox",

  [AppRoutes.SETTINGS_PROFILE]: "/settings/profile",
  [AppRoutes.SETTINGS_NOTIFICATIONS]: "/settings/notifications",
  [AppRoutes.SETTINGS_PIPELINE_STATUSES]: "/settings/pipeline-statuses",
  [AppRoutes.SETTINGS_DANGER_ZONE]: "/settings/danger-zone",

  [AppRoutes.PROFILE_QUESTIONS]: "/profile-questions",

  [AppRoutes.BOARD]: "/board",
  [AppRoutes.LOOPS]: "/loops",
  [AppRoutes.LOOP_DETAILS]: "/loops/:loopId",
  [AppRoutes.MATCHES]: "/matches",

  [AppRoutes.NOT_FOUND]: "*",
};
