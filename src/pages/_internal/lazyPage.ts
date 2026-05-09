import type React from "react";
import { lazy } from "react";

import { loadTranslations } from "src/shared/config/i18n";

interface PageModule {
  default: React.ComponentType;
}

interface LocaleBundle {
  [key: string]: string | LocaleBundle;
}

interface LocaleModule {
  default: LocaleBundle;
}

interface PageLocalesModule {
  en: LocaleModule;
  ru: LocaleModule;
  de: LocaleModule;
}

export function lazyPage(
  componentImport: () => Promise<PageModule>,
  bundleName: string,
  localesImport?: () => Promise<PageLocalesModule>,
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
