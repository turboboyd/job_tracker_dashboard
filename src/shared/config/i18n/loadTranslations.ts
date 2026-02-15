import i18n from "./i18n";
import type { SupportedLng } from "./i18n";

type Translations = Record<SupportedLng, Record<string, unknown>>;

export function loadTranslations(bundleName: string, translations: Translations) {
  (Object.keys(translations) as SupportedLng[]).forEach((lng) => {
    const exists = i18n.hasResourceBundle(lng, "translation");
    if (!exists) {
      i18n.addResourceBundle(lng, "translation", {}, true, true);
    }

    const data = translations[lng];
    i18n.addResourceBundle(
      lng,
      "translation",
      { [bundleName]: data },
      true,
      true,
    );
  });
}
