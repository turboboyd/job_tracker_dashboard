import { Menu, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { UserMenu } from "src/app/widgets";
import { useAuthSelectors } from "src/entities/auth";
import { Button, ThemeToggle } from "src/shared/ui";
import { LanguageSelectConnected } from "src/shared/ui/molecules/LanguageSelect/LanguageSelectConnected";

type AppHeaderProps = {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

type NavItem = {
  label: string;
  path: string;
};

const guestNavItems: NavItem[] = [
  { label: "header.home", path: "/" },
  { label: "header.resources", path: "/resources" },
  { label: "header.about", path: "/about" },
];

const authNavItems: NavItem[] = [
  { label: "header.dashboard", path: "/dashboard" },
];

function linkClass(isActive: boolean) {
  return [
    "text-sm transition-colors",
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  ].join(" ");
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthSelectors();

  const navItems = isAuthenticated ? authNavItems : guestNavItems;

  return (
    <header className="h-16 bg-card shadow-[var(--shadow-sm)]">
      <div className="mx-auto flex h-full max-w-container items-center justify-between pl-12 pr-4 ">
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}

          {!isAuthenticated && (
            <div className="text-sm font-semibold">{t("header.appName")}</div>
          )}

          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => linkClass(isActive)}
              >
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <UserMenu
              settingsPath={`${RoutePath[AppRoutes.SETTINGS_PROFILE]}`}
            />
          ) : (
            <div className="flex items-center gap-3">
              <NavLink
                to={RoutePath[AppRoutes.LOGIN]}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("auth.signIn")}
              </NavLink>
              <NavLink
                to={RoutePath[AppRoutes.REGISTER]}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("auth.createAccount")}
              </NavLink>
            </div>
          )}
          <LanguageSelectConnected labelMode="short" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
