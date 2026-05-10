import type { SupportedLng } from "src/shared/config/i18n/i18n";

import type { LanguageItem } from "./languageSelect.types";

export const LANGUAGES: readonly LanguageItem<SupportedLng>[] = [
  { code: "en", shortLabel: "EN", fullLabel: "English" },
  { code: "ru", shortLabel: "RU", fullLabel: "Русский" },
  { code: "de", shortLabel: "DE", fullLabel: "Deutsch" },
  { code: "uk", shortLabel: "UK", fullLabel: "Українська" },
] as const;
