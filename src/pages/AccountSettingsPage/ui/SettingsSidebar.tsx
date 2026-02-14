import {
  Bell,
  ShieldAlert,
  SlidersHorizontal,
  User,
  ChevronRight,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { Card } from "src/shared/ui/Card/Card";
import { SectionHeader } from "src/shared/ui/PageHeaders/PageHeaders";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "danger";
  hint?: string;
};

function baseItemClass(isActive: boolean) {
  return [
    "group flex items-center justify-between gap-2",
    "rounded-md px-sm py-2",
    "border border-transparent",
    "transition duration-normal ease-in-out",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}

function iconClass(isActive: boolean, variant: Item["variant"] | undefined) {
  if (variant === "danger") {
    return isActive
      ? "text-destructive"
      : "text-destructive/80 group-hover:text-destructive";
  }
  return isActive
    ? "text-foreground"
    : "text-muted-foreground group-hover:text-foreground";
}

export function SettingsSidebar() {
  const { t } = useTranslation();

  const items: Item[] = [
    {
      to: RoutePath[AppRoutes.SETTINGS_PROFILE],
      label: t("accountSettings.sidebar.profile", "Profile"),
      icon: User,
    },
    {
      to: RoutePath[AppRoutes.SETTINGS_NOTIFICATIONS],
      label: t("accountSettings.sidebar.notifications", "Notifications"),
      icon: Bell,
    },
    {
      to: RoutePath[AppRoutes.SETTINGS_PIPELINE_STATUSES],
      label: t(
        "accountSettings.sidebar.pipelineStatuses",
        "Pipeline / Statuses"
      ),
      icon: SlidersHorizontal,
    },
    {
      to: RoutePath[AppRoutes.SETTINGS_DANGER_ZONE],
      label: t("accountSettings.sidebar.dangerZone", "Danger Zone"),
      icon: ShieldAlert,
      variant: "danger",
      hint: t("accountSettings.sidebar.sensitiveActions", "Sensitive actions"),
    },
  ];

  return (
    <Card className="p-4">
      <SectionHeader
        title={t("accountSettings.sidebar.settings", "Settings")}
        subtitle={t("accountSettings.sidebar.account", "Account")}
      />

      <div className="mt-3 space-y-1">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => {
              const Icon = item.icon;

              return (
                <div className={baseItemClass(isActive)}>
                  <div className="flex items-center gap-2">
                    <Icon
                      className={[
                        "h-4 w-4",
                        iconClass(isActive, item.variant),
                      ].join(" ")}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {item.label}
                      </div>
                      {item.hint ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {item.hint}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              );
            }}
          </NavLink>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        {t(
          "accountSettings.sidebar.tip",
          "Tip: use the menu to switch sections."
        )}
      </div>
    </Card>
  );
}
