import React from "react";

import {MainPage,AboutPage,NotFoundPage, DashboardPage, JobsPage, ResourcesPage, LoginPage } from "src/pages";

/* eslint no-unused-vars: ["warn", { "varsIgnorePattern": "^[A-Z_]+$" }] */

export enum AppRoutes {
  MAIN = "main",
  ABOUT = "about",
  RESOURCES = "resources",
  LOGIN = "login",
  DASHBOARD = "dashboard",
  JOBS = "jobs",
  NOT_FOUND = "not_found",
}

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.MAIN]: "/",
  [AppRoutes.ABOUT]: "/about",
  [AppRoutes.RESOURCES]: "/resources",
  [AppRoutes.LOGIN]: "/login",
  [AppRoutes.DASHBOARD]: "/dashboard",
  [AppRoutes.JOBS]: "/dashboard/jobs",
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
];

export const privateRoutes: RouteItem[] = [
  { path: RoutePath[AppRoutes.DASHBOARD], element: <DashboardPage /> },
  { path: RoutePath[AppRoutes.JOBS], element: <JobsPage /> },
];

export const notFoundRoute: RouteItem = {
  path: RoutePath[AppRoutes.NOT_FOUND],
  element: <NotFoundPage />,
};