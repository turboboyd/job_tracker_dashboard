import { loadTranslations } from "src/shared/config/i18n";

let resourcesLocalesLoaded = false;

export async function ensureResourcesLocalesLoaded() {
  if (resourcesLocalesLoaded) return;

  const [en, ru, de] = await Promise.all([
    import("./locales/en.json"),
    import("./locales/ru.json"),
    import("./locales/de.json"),
  ]);

  loadTranslations("resources", {
    en: en.default,
    ru: ru.default,
    de: de.default,
    uk: {},
  });

  resourcesLocalesLoaded = true;
}
