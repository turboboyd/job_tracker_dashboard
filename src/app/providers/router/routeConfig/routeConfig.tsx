import React from "react";

import {
  MainPage,
  AboutPage,
  NotFoundPage,
  DashboardPage,
  DashboardAnalyticsPage,
  DashboardActivityPage,
  ResourcesPage,
  LoginPage,
  RegisterPage,
  LoopsPage,
  WhatsNewPage,
  MatchesPage,
  BoardPage,
  ApplicationsPage,
  QuestionsPage,
  CvCheckerPage,
  CvBuilderPage,
  InboxPage,
  ProfileSettingsPage,
  NotificationsSettingsPage,
  PipelineStatusesSettingsPage,
  DangerZoneSettingsPage,
  ProfileQuestionsPage
} from "src/pages";


/* eslint no-unused-vars: ["warn", { "varsIgnorePattern": "^[A-Z_]+$" }] */

export enum AppRoutes {
  MAIN = "main",
  ABOUT = "about",
  RESOURCES = "resources",
  LOGIN = "login",
  REGISTER = "register",
  DASHBOARD = "dashboard",

  DASHBOARD_ANALYTICS = "dashboard_analytics",
  DASHBOARD_ACTIVITY = "dashboard_activity",

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
  WHATS_NEW = "whats_new",
  LOOPS = "loops",
  LOOP_DETAILS = "loop_details",
  MATCHES = "matches",
  NOT_FOUND = "not_found",
  BOARD = "board",
}

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.MAIN]: `/`,
  [AppRoutes.ABOUT]: "/about",
  [AppRoutes.RESOURCES]: "/resources",
  [AppRoutes.LOGIN]: "/login",
  [AppRoutes.REGISTER]: "/register",
  [AppRoutes.WHATS_NEW]: "/whats-new",

  [AppRoutes.DASHBOARD]: "/dashboard",

  [AppRoutes.DASHBOARD_ANALYTICS]: "/dashboard/analytics",
  [AppRoutes.DASHBOARD_ACTIVITY]: "/dashboard/activity",

  [AppRoutes.APPLICATIONS]: "/dashboard/applications",
  [AppRoutes.QUESTIONS]: "/dashboard/questions",
  [AppRoutes.CV_CHECKER]: "/dashboard/cv-checker",
  [AppRoutes.CV_BUILDER]: "/dashboard/cv-builder",
  [AppRoutes.INBOX]: "/dashboard/inbox",



  // SETTINGS_PROFILE
  [AppRoutes.SETTINGS_PROFILE]: "/dashboard/settings/profile",
  [AppRoutes.SETTINGS_NOTIFICATIONS]: "/dashboard/settings/notifications",
  [AppRoutes.SETTINGS_PIPELINE_STATUSES]:
    "/dashboard/settings/pipeline-statuses",
  [AppRoutes.SETTINGS_DANGER_ZONE]: "/dashboard/settings/danger-zone",

  [AppRoutes.PROFILE_QUESTIONS]: "/dashboard/profile/questions",

  [AppRoutes.BOARD]: "/dashboard/board",
  [AppRoutes.LOOPS]: "/dashboard/loops",
  [AppRoutes.LOOP_DETAILS]: "/dashboard/loops/:loopId",
  [AppRoutes.MATCHES]: "/dashboard/matches",
  [AppRoutes.NOT_FOUND]: "/*",
};

export type RouteItem = {
  path: string;
  element: React.ReactElement;
};

export const publicRoutes: RouteItem[] = [
  { path: RoutePath[AppRoutes.MAIN], element: <MainPage /> },
  { path: RoutePath[AppRoutes.ABOUT], element: <AboutPage /> },
  { path: RoutePath[AppRoutes.RESOURCES], element: <ResourcesPage /> },
  { path: RoutePath[AppRoutes.LOGIN], element: <LoginPage /> },
  { path: RoutePath[AppRoutes.REGISTER], element: <RegisterPage /> },
  { path: RoutePath[AppRoutes.WHATS_NEW], element: <WhatsNewPage /> },
];

export const privateRoutes: RouteItem[] = [
  { path: RoutePath[AppRoutes.DASHBOARD], element: <DashboardPage /> },

  // Dashboard tabs
  {
    path: RoutePath[AppRoutes.DASHBOARD_ANALYTICS],
    element: <DashboardAnalyticsPage />,
  },
  {
    path: RoutePath[AppRoutes.DASHBOARD_ACTIVITY],
    element: <DashboardActivityPage />,
  },

  { path: RoutePath[AppRoutes.APPLICATIONS], element: <ApplicationsPage /> },
  { path: RoutePath[AppRoutes.QUESTIONS], element: <QuestionsPage /> },
  { path: RoutePath[AppRoutes.CV_CHECKER], element: <CvCheckerPage /> },
  { path: RoutePath[AppRoutes.CV_BUILDER], element: <CvBuilderPage /> },
  { path: RoutePath[AppRoutes.INBOX], element: <InboxPage /> },

  {
    path: RoutePath[AppRoutes.PROFILE_QUESTIONS],
    element: <ProfileQuestionsPage />,
  },

  { path: RoutePath[AppRoutes.BOARD], element: <BoardPage /> },

  { path: RoutePath[AppRoutes.LOOPS], element: <LoopsPage /> },
  { path: RoutePath[AppRoutes.LOOP_DETAILS], element: <LoopsPage /> },
  { path: RoutePath[AppRoutes.MATCHES], element: <MatchesPage /> },

  {
    path: RoutePath[AppRoutes.SETTINGS_PROFILE],
    element: <ProfileSettingsPage />,
  },
  {
    path: RoutePath[AppRoutes.SETTINGS_NOTIFICATIONS],
    element: <NotificationsSettingsPage />,
  },
  {
    path: RoutePath[AppRoutes.SETTINGS_PIPELINE_STATUSES],
    element: <PipelineStatusesSettingsPage />,
  },
  {
    path: RoutePath[AppRoutes.SETTINGS_DANGER_ZONE],
    element: <DangerZoneSettingsPage />,
  },
];

export const notFoundRoute: RouteItem = {
  path: RoutePath[AppRoutes.NOT_FOUND],
  element: <NotFoundPage />,
};

// Convenience aggregate (some parts of the codebase expect a single list)
export const routeConfig: RouteItem[] = [
  ...publicRoutes,
  ...privateRoutes,
  notFoundRoute,
];
