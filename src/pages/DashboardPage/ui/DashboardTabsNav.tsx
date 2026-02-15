import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";

type Tab = {
  to: string;
  labelKey: string;
  fallback: string;
  end?: boolean;
};

const tabs: Tab[] = [
  {
    to: RoutePath[AppRoutes.DASHBOARD],
    labelKey: "tabs.overview",
    fallback: "Overview",
    end: true,
  },
  {
    to: RoutePath[AppRoutes.DASHBOARD_ANALYTICS],
    labelKey: "tabs.analytics",
    fallback: "Analytics",
  },

  {
    to: RoutePath[AppRoutes.DASHBOARD_ACTIVITY],
    labelKey: "tabs.activity",
    fallback: "Activity",
  },
];

export function DashboardTabsNav() {
   const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            [
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              isActive
                ? "border-foreground/30 bg-muted text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/60",
            ].join(" ")
          }
        >
          {t(tab.labelKey, tab.fallback)}
        </NavLink>
      ))}
    </div>
  );
}
