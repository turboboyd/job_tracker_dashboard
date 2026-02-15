import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// NOTE: We keep the initial bundle minimal and load page bundles lazily.
// These base bundles are used across the app layout (header, auth flows, common UI).
import headerDe from "src/app/widgets/header/AppHeader/locales/de.json";
import headerEn from "src/app/widgets/header/AppHeader/locales/en.json";
import headerRu from "src/app/widgets/header/AppHeader/locales/ru.json";
// NOTE: shared layer must not import from features/auth locales directly.
// We keep a mirrored copy of auth translations in shared/locales/auth.
import authDe from "src/shared/locales/auth/de.json";
import authEn from "src/shared/locales/auth/en.json";
import authRu from "src/shared/locales/auth/ru.json";
import commonDe from "src/shared/locales/common/de.json";
import commonEn from "src/shared/locales/common/en.json";
import commonRu from "src/shared/locales/common/ru.json";


export const supportedLngs = ["en", "ru", "de", "uk"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          common: commonEn,
          auth: authEn,
          header: headerEn,
        },
      },
      ru: {
        translation: {
          common: commonRu,
          auth: authRu,
          header: headerRu,
        },
      },
      de: {
        translation: {
          common: commonDe,
          auth: authDe,
          header: headerDe,
        },
      },
      // Ukrainian is supported as a language option, but not all bundles have translations yet.
      // We still register the language so the app can switch to it safely.
      uk: {
        translation: {
          common: {},
          auth: {},
          header: {},
        },
      },
    },
    fallbackLng: "en",
    supportedLngs,
    defaultNS: "translation",
    interpolation: { escapeValue: false },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "app_lang",
    },

    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;
