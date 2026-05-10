import i18n from "./i18n";
import type { SupportedLng } from "./i18n";

type Translations = Record<SupportedLng, Record<string, unknown>>;

function unwrapSelfNamedBundle(
  bundleName: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const keys = Object.keys(data);
  const nested = data[bundleName];

  if (
    keys.length === 1 &&
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested)
  ) {
    return nested as Record<string, unknown>;
  }

  return data;
}

export function loadTranslations(bundleName: string, translations: Translations) {
  (Object.keys(translations) as SupportedLng[]).forEach((lng) => {
    const exists = i18n.hasResourceBundle(lng, "translation");
    if (!exists) {
      i18n.addResourceBundle(lng, "translation", {}, true, true);
    }

    const data = unwrapSelfNamedBundle(bundleName, translations[lng]);
    i18n.addResourceBundle(
      lng,
      "translation",
      { [bundleName]: data },
      true,
      true,
    );
  });
}
