import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { loadTranslations } from "src/shared/config/i18n/loadTranslations";

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
    subtitle ?? t("accountSettings.page.subtitle", "Profile, notifications, security and more.");

  const tabs = [
    {
      to: RoutePath[AppRoutes.SETTINGS_PROFILE],
      label: t("accountSettings.sidebar.profile", "Profile"),
    },
    {
      to: RoutePath[AppRoutes.SETTINGS_NOTIFICATIONS],
      label: t("accountSettings.sidebar.notifications", "Notifications"),
    },
    {
      to: RoutePath[AppRoutes.SETTINGS_PIPELINE_STATUSES],
      label: t("accountSettings.sidebar.pipelineStatuses", "Pipeline"),
    },
    {
      to: RoutePath[AppRoutes.SETTINGS_DANGER_ZONE],
      label: t("accountSettings.sidebar.dangerZone", "Danger zone"),
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-7 pt-5 pb-0">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <span className="text-muted-foreground">{resolvedTitle}</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              {resolvedTitle}
            </h1>
            {resolvedSubtitle ? (
              <p className="mt-1 text-[13px] text-muted-foreground">{resolvedSubtitle}</p>
            ) : null}
          </div>

          {/* Underline tabs */}
          <div className="flex items-end gap-0.5 overflow-x-auto">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                className={({ isActive }) =>
                  [
                    "-mb-px px-3.5 py-2 text-[13px] transition-colors cursor-pointer select-none whitespace-nowrap",
                    isActive
                      ? "border-b-2 border-primary font-medium text-foreground"
                      : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
                  ].join(" ")
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-[920px] p-7">
          {content}
        </div>
      </div>
    </div>
  );
}
