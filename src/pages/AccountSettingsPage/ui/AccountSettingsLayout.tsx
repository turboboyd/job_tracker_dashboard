import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { loadTranslations } from "src/shared/config/i18n/loadTranslations";
import { PageHeader, PageShell } from "src/shared/ui";

import { SettingsSidebar } from "./SettingsSidebar";

type Props = {
  title?: string;
  subtitle?: string;
  content: React.ReactNode;
};

let accountSettingsLocalesLoaded = false;

async function ensureAccountSettingsLocalesLoaded() {
  if (accountSettingsLocalesLoaded) return;

  const [en, ru, de] = await Promise.all([
    import("../locales/en.json"),
    import("../locales/ru.json"),
    import("../locales/de.json"),
  ]);

  loadTranslations("accountSettings", {
    en: en.default,
    ru: ru.default,
    de: de.default,
    uk: {},
  });

  accountSettingsLocalesLoaded = true;
}

export function AccountSettingsLayout({ title, subtitle, content }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    void ensureAccountSettingsLocalesLoaded();
  }, []);

  const resolvedTitle =
    title ?? t("accountSettings.page.title", "Account settings");
  const resolvedSubtitle =
    subtitle ?? t("accountSettings.page.subtitle", "Profile");

  return (
    <PageShell className="space-y-6">
      <PageHeader title={resolvedTitle} subtitle={resolvedSubtitle} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <SettingsSidebar />
        <div>{content}</div>
      </div>
    </PageShell>
  );
}
