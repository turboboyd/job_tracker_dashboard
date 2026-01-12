import { lazy } from "react";

export const MainPage = lazy(() => import("./MainPage/MainPage"));
export const AboutPage = lazy(() => import("./AboutPage/AboutPage"));
export const ResourcesPage = lazy(
  () => import("./ResourcesPage/ResourcesPage")
);
export const LoginPage = lazy(() => import("./LoginPage/LoginPage"));
export const DashboardPage = lazy(
  () => import("./DashboardPage/DashboardPage")
);
export const JobsPage = lazy(() => import("./JobsPage/JobsPage"));
export const NotFoundPage = lazy(() => import("./NotFoundPage/NotFoundPage"));
