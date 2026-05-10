import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";

const tabs = [
  { to: RoutePath[AppRoutes.DASHBOARD], labelKey: "tabs.overview", fallback: "Overview", end: true },
  { to: RoutePath[AppRoutes.DASHBOARD_ANALYTICS], labelKey: "tabs.analytics", fallback: "Analytics" },
  { to: RoutePath[AppRoutes.DASHBOARD_ACTIVITY], labelKey: "tabs.activity", fallback: "Activity" },
];

export function DashboardTabsNav() {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  return (
    <div className="flex items-end gap-0.5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            [
              "-mb-px px-3.5 py-2 text-[13px] transition-colors cursor-pointer select-none",
              isActive
                ? "border-b-2 border-primary font-medium text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")
          }
        >
          {t(tab.labelKey, tab.fallback)}
        </NavLink>
      ))}
    </div>
  );
}
