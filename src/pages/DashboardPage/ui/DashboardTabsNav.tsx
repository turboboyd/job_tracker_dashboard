import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/shared/config/routes";

interface Tab {
  to: string;
  labelKey: string;
  fallback: string;
  end?: boolean;
}

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
    to: RoutePath[AppRoutes.DASHBOARD_CALENDAR],
    labelKey: "tabs.calendar",
    fallback: "Calendar",
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
    <div className="flex items-center gap-0.5 border-b border-border -mb-px">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          {...(tab.end !== undefined ? { end: tab.end } : {})}
          className={({ isActive }) =>
            [
              "relative px-3 py-2 text-sm font-medium transition-colors duration-150",
              "border-b-2 -mb-px",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            ].join(" ")
          }
        >
          {t(tab.labelKey, tab.fallback)}
        </NavLink>
      ))}
    </div>
  );
}
