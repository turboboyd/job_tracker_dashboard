import React from "react";

import {
  MainPage,
  AboutPage,
  NotFoundPage,
  DashboardPage,
  DashboardAnalyticsPage,
  DashboardActivityPage,
  DashboardCalendarPage,
  ResourcesPage,
  LoginPage,
  RegisterPage,
  LoopsPage,
  WhatsNewPage,
  MatchesPage,
  BoardPage,
  ApplicationsPage,
  ApplicationDetailsPage,
  QuestionsPage,
  CvCheckerPage,
  CvBuilderPage,
  InboxPage,
  ContactsPage,
  ProfileSettingsPage,
  NotificationsSettingsPage,
  PipelineStatusesSettingsPage,
  DangerZoneSettingsPage,
  ProfileQuestionsPage,
} from "src/pages";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

export interface RouteItem {
  path: string;
  element: React.ReactElement;
}

export const publicRoutes: RouteItem[] = [
  { path: RoutePath[AppRoutes.MAIN], element: <MainPage /> },
  { path: RoutePath[AppRoutes.ABOUT], element: <AboutPage /> },
  { path: RoutePath[AppRoutes.RESOURCES], element: <ResourcesPage /> },
  { path: RoutePath[AppRoutes.LOGIN], element: <LoginPage /> },
  { path: RoutePath[AppRoutes.REGISTER], element: <RegisterPage /> },
  { path: RoutePath[AppRoutes.WHATS_NEW], element: <WhatsNewPage /> },
];

export const privateRoutes: RouteItem[] = [
  {
    path: RoutePath[AppRoutes.DASHBOARD_RESOURCES],
    element: <ResourcesPage />,
  },
  { path: RoutePath[AppRoutes.DASHBOARD], element: <DashboardPage /> },
  {
    path: RoutePath[AppRoutes.DASHBOARD_ANALYTICS],
    element: <DashboardAnalyticsPage />,
  },
  {
    path: RoutePath[AppRoutes.DASHBOARD_ACTIVITY],
    element: <DashboardActivityPage />,
  },
  {
    path: RoutePath[AppRoutes.DASHBOARD_CALENDAR],
    element: <DashboardCalendarPage />,
  },
  { path: RoutePath[AppRoutes.APPLICATIONS], element: <ApplicationsPage /> },
  {
    path: RoutePath[AppRoutes.APPLICATION_DETAILS],
    element: <ApplicationDetailsPage />,
  },
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
  { path: RoutePath[AppRoutes.CONTACTS], element: <ContactsPage /> },
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

export const routeConfig: RouteItem[] = [
  ...publicRoutes,
  ...privateRoutes,
  notFoundRoute,
];
