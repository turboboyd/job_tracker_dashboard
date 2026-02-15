import React, { lazy } from "react";

import { loadTranslations } from "src/shared/config/i18n/loadTranslations";

type PageModule = { default: React.ComponentType };

type LocaleBundle = {
  [key: string]: string | LocaleBundle;
};
type LocaleModule = { default: LocaleBundle };
function lazyPage(
  componentImport: () => Promise<PageModule>,
  bundleName: string,
  localesImport?: () => Promise<{
    en: LocaleModule;
    ru: LocaleModule;
    de: LocaleModule;
  }>,
) {
  return lazy(async () => {
    const [component, locales] = await Promise.all([
      componentImport(),
      localesImport?.(),
    ]);

    if (locales) {
      loadTranslations(bundleName, {
        en: locales.en.default,
        ru: locales.ru.default,
        de: locales.de.default,
        uk: {},
      });
    }

    return component;
  });
}

export const MainPage = lazyPage(
  () => import("./MainPage/MainPage"),
  "home",
  async () => ({
    en: await import("./MainPage/locales/en.json"),
    ru: await import("./MainPage/locales/ru.json"),
    de: await import("./MainPage/locales/de.json"),
  }),
);

export const AboutPage = lazyPage(
  () => import("./AboutPage/AboutPage"),
  "about",
  async () => ({
    en: await import("./AboutPage/locales/en.json"),
    ru: await import("./AboutPage/locales/ru.json"),
    de: await import("./AboutPage/locales/de.json"),
  }),
);

export const ResourcesPage = lazyPage(
  () => import("./ResourcesPage/ResourcesPage"),
  "resources",
  async () => ({
    en: await import("./ResourcesPage/locales/en.json"),
    ru: await import("./ResourcesPage/locales/ru.json"),
    de: await import("./ResourcesPage/locales/de.json"),
  }),
);

export const LoginPage = lazyPage(
  () => import("./LoginPage/LoginPage"),
  "login",
  async () => ({
    en: await import("./LoginPage/locales/en.json"),
    ru: await import("./LoginPage/locales/ru.json"),
    de: await import("./LoginPage/locales/de.json"),
  }),
);

export const RegisterPage = lazyPage(
  () => import("./RegisterPage/RegisterPage"),
  "register",
  async () => ({
    en: await import("./RegisterPage/locales/en.json"),
    ru: await import("./RegisterPage/locales/ru.json"),
    de: await import("./RegisterPage/locales/de.json"),
  }),
);

export const DashboardPage = lazyPage(
  () => import("./DashboardPage/DashboardPage"),
  "dashboard",
  async () => ({
    en: await import("./DashboardPage/locales/en.json"),
    ru: await import("./DashboardPage/locales/ru.json"),
    de: await import("./DashboardPage/locales/de.json"),
  }),
);

export const DashboardAnalyticsPage = lazyPage(
  () => import("./DashboardPage/DashboardAnalyticsPage"),
  "dashboard",
  async () => ({
    en: await import("./DashboardPage/locales/en.json"),
    ru: await import("./DashboardPage/locales/ru.json"),
    de: await import("./DashboardPage/locales/de.json"),
  }),
);

export const DashboardActivityPage = lazyPage(
  () => import("./DashboardPage/DashboardActivityPage"),
  "dashboard",
  async () => ({
    en: await import("./DashboardPage/locales/en.json"),
    ru: await import("./DashboardPage/locales/ru.json"),
    de: await import("./DashboardPage/locales/de.json"),
  }),
);

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

export const ProfileQuestionsPage = lazyPage(
  () => import("./ProfileQuestionsPage/ProfileQuestionsPage"),
  "profileQuestions",
  async () => ({
    en: await import("./ProfileQuestionsPage/locales/en.json"),
    ru: await import("./ProfileQuestionsPage/locales/ru.json"),
    de: await import("./ProfileQuestionsPage/locales/de.json"),
  }),
);

export const LoopsPage = lazyPage(
  () => import("./LoopsPage/LoopsPage"),
  "loops",
  async () => ({
    en: await import("./LoopsPage/locales/en.json"),
    ru: await import("./LoopsPage/locales/ru.json"),
    de: await import("./LoopsPage/locales/de.json"),
  }),
);

export const NotFoundPage = lazyPage(
  () => import("./NotFoundPage/NotFoundPage"),
  "notFound",
  async () => ({
    en: await import("./NotFoundPage/locales/en.json"),
    ru: await import("./NotFoundPage/locales/ru.json"),
    de: await import("./NotFoundPage/locales/de.json"),
  }),
);

export const WhatsNewPage = lazyPage(
  () => import("./WhatsNewPage/WhatsNewPage"),
  "whatsNew",
  async () => ({
    en: await import("./WhatsNewPage/locales/en.json"),
    ru: await import("./WhatsNewPage/locales/ru.json"),
    de: await import("./WhatsNewPage/locales/de.json"),
  }),
);

export const MatchesPage = lazyPage(
  () => import("./MatchesPage/MatchesPage"),
  "matches",
  async () => ({
    en: await import("./MatchesPage/locales/en.json"),
    ru: await import("./MatchesPage/locales/ru.json"),
    de: await import("./MatchesPage/locales/de.json"),
  }),
);

export const BoardPage = lazyPage(
  () => import("./BoardPage/BoardPage"),
  "board",
  async () => ({
    en: await import("./BoardPage/locales/en.json"),
    ru: await import("./BoardPage/locales/ru.json"),
    de: await import("./BoardPage/locales/de.json"),
  }),
);

export const ApplicationsPage = lazyPage(
  () => import("./ApplicationsPage/ApplicationsPage"),
  "applications",
  async () => ({
    en: await import("./ApplicationsPage/locales/en.json"),
    ru: await import("./ApplicationsPage/locales/ru.json"),
    de: await import("./ApplicationsPage/locales/de.json"),
  }),
);

export const QuestionsPage = lazyPage(
  () => import("./QuestionsPage/QuestionsPage"),
  "questions",
  async () => ({
    en: await import("./QuestionsPage/locales/en.json"),
    ru: await import("./QuestionsPage/locales/ru.json"),
    de: await import("./QuestionsPage/locales/de.json"),
  }),
);

export const CvCheckerPage = lazyPage(
  () => import("./CvCheckerPage/CvCheckerPage"),
  "cvChecker",
  async () => ({
    en: await import("./CvCheckerPage/locales/en.json"),
    ru: await import("./CvCheckerPage/locales/ru.json"),
    de: await import("./CvCheckerPage/locales/de.json"),
  }),
);

export const CvBuilderPage = lazyPage(
  () => import("./CvBuilderPage/CvBuilderPage"),
  "cvBuilder",
  async () => ({
    en: await import("./CvBuilderPage/locales/en.json"),
    ru: await import("./CvBuilderPage/locales/ru.json"),
    de: await import("./CvBuilderPage/locales/de.json"),
  }),
);

export const InboxPage = lazyPage(
  () => import("./InboxPage/InboxPage"),
  "inbox",
  async () => ({
    en: await import("./InboxPage/locales/en.json"),
    ru: await import("./InboxPage/locales/ru.json"),
    de: await import("./InboxPage/locales/de.json"),
  }),
);
