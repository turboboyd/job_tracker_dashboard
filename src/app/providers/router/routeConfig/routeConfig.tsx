import React from "react";

import {
  MainPage,
  AboutPage,
  NotFoundPage,
  DashboardPage,
  JobsPage,
  ResourcesPage,
  LoginPage,
  RegisterPage,
  LoopsPage,
} from "src/pages";
import ProfilePage from "src/pages/ProfilePage/ProfilePage";
import ProfileQuestionsPage from "src/pages/ProfileQuestionsPage/ProfileQuestionsPage";

/* eslint no-unused-vars: ["warn", { "varsIgnorePattern": "^[A-Z_]+$" }] */

export enum AppRoutes {
  MAIN = "main",
  ABOUT = "about",
  RESOURCES = "resources",
  LOGIN = "login",
  REGISTER = "register",
  DASHBOARD = "dashboard",
  JOBS = "jobs",
  PROFILE = "profile",
  PROFILE_QUESTIONS = "profile_questions",

  LOOPS = "loops",
  LOOP_DETAILS = "loop_details",

  NOT_FOUND = "not_found",
}

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.MAIN]: "/",
  [AppRoutes.ABOUT]: "/about",
  [AppRoutes.RESOURCES]: "/resources",
  [AppRoutes.LOGIN]: "/login",
  [AppRoutes.REGISTER]: "/register",

  [AppRoutes.DASHBOARD]: "/dashboard",
  [AppRoutes.JOBS]: "/dashboard/jobs",
  [AppRoutes.PROFILE]: "/dashboard/profile",
  [AppRoutes.PROFILE_QUESTIONS]: "/dashboard/profile/questions",

  [AppRoutes.LOOPS]: "/dashboard/loops",
  [AppRoutes.LOOP_DETAILS]: "/dashboard/loops/:loopId",

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
];

export const privateRoutes: RouteItem[] = [
  { path: RoutePath[AppRoutes.DASHBOARD], element: <DashboardPage /> },
  { path: RoutePath[AppRoutes.JOBS], element: <JobsPage /> },
  { path: RoutePath[AppRoutes.PROFILE], element: <ProfilePage /> },
  { path: RoutePath[AppRoutes.PROFILE_QUESTIONS], element: <ProfileQuestionsPage /> },

  { path: RoutePath[AppRoutes.LOOPS], element: <LoopsPage /> },
  { path: RoutePath[AppRoutes.LOOP_DETAILS], element: <LoopsPage /> },
];

export const notFoundRoute: RouteItem = {
  path: RoutePath[AppRoutes.NOT_FOUND],
  element: <NotFoundPage />,
};
