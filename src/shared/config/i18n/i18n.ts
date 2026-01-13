import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../../../../extractedTranslations/en/translation.json";
import ru from "../../../../extractedTranslations/ru/translation.json";
import de from "../../../../extractedTranslations/de/translation.json";
import uk from "../../../../extractedTranslations/uk/translation.json";

export const supportedLngs = ["en", "ru", "de", "uk"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      de: { translation: de },
      uk: { translation: uk },
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
