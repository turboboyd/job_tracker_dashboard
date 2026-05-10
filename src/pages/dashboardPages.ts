import { lazyPage } from "./_internal/lazyPage";

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

export const DashboardCalendarPage = lazyPage(
  () => import("./DashboardPage/DashboardCalendarPage"),
  "dashboard",
  async () => ({
    en: await import("./DashboardPage/locales/en.json"),
    ru: await import("./DashboardPage/locales/ru.json"),
    de: await import("./DashboardPage/locales/de.json"),
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
  "applicationsPage",
  async () => ({
    en: await import("./ApplicationsPage/locales/en.json"),
    ru: await import("./ApplicationsPage/locales/ru.json"),
    de: await import("./ApplicationsPage/locales/de.json"),
  }),
);

export const ApplicationDetailsPage = lazyPage(
  () => import("./ApplicationDetailsPage/ApplicationDetailsPage"),
  "applicationDetails",
  async () => ({
    en: await import("./ApplicationDetailsPage/locales/en.json"),
    ru: await import("./ApplicationDetailsPage/locales/ru.json"),
    de: await import("./ApplicationDetailsPage/locales/de.json"),
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

export const ContactsPage = lazyPage(
  () => import("./ContactsPage/ContactsPage"),
  "contacts",
  async () => ({
    en: await import("./ContactsPage/locales/en.json"),
    ru: await import("./ContactsPage/locales/ru.json"),
    de: await import("./ContactsPage/locales/de.json"),
  }),
);
