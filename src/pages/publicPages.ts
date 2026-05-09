import { lazyPage } from "./_internal/lazyPage";

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
